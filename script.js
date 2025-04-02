let names = [];
let assignments = [];
let index = 0;
let numNames = 0;
let numRooms = 0;

// Initialize audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to play a beep sound
function playBeep(frequency, duration) {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.log('Error playing sound:', error);
  }
}

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
  
  // Play celebration sound (higher pitch)
  playBeep(880, 0.5);
  
  // Play triumphant sound (lower pitch)
  playBeep(440, 0.5);
}

function playAssignSound() {
  // Play a short beep
  playBeep(660, 0.2);
}

function restartApp() {
  // Reset all variables
  names = [];
  assignments = [];
  index = 0;
  numNames = 0;
  numRooms = 0;
  
  // Hide assignment section and show setup section
  document.getElementById('assignment-section').classList.add('hidden');
  document.getElementById('setup-section').classList.remove('hidden');
  
  // Reset the buttons
  document.getElementById('restart-button').classList.add('hidden');
  document.getElementById('save-button').classList.add('hidden');
  
  // Reset the status message
  document.getElementById('status').textContent = '';
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function initializeInputs() {
  numNames = parseInt(document.getElementById('numNames').value);
  numRooms = parseInt(document.getElementById('numRooms').value);

  if (numNames < 1 || numRooms < 1) {
    alert("Please enter valid numbers (greater than 0)");
    return;
  }

  // Generate name inputs
  const nameInputsContainer = document.getElementById('name-inputs');
  nameInputsContainer.innerHTML = '';
  for (let i = 0; i < numNames; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Name ${i + 1}`;
    nameInputsContainer.appendChild(input);
    nameInputsContainer.appendChild(document.createElement('br'));
  }

  // Generate rooms
  const roomsContainer = document.getElementById('rooms-container');
  roomsContainer.innerHTML = '';
  for (let i = 0; i < numRooms; i++) {
    const room = document.createElement('div');
    room.className = 'room';
    room.id = `room${i + 1}`;
    // Add color class (cycle through 8 colors)
    const colorIndex = (i % 8) + 1;
    room.classList.add(`room-color-${colorIndex}`);
    room.innerHTML = `<h3>Room ${i + 1}</h3><ul></ul>`;
    roomsContainer.appendChild(room);
  }

  // Update room width based on number of rooms
  const roomWidth = Math.min(22, 100 / numRooms - 2);
  document.querySelectorAll('.room').forEach(room => {
    room.style.width = `${roomWidth}%`;
  });

  document.getElementById('setup-section').classList.add('hidden');
  document.getElementById('input-section').classList.remove('hidden');
}

function loadDefaultNames() {
  const defaultNames = ['Hynio', 'Lancuch', 'Kocur', 'Mati', 'Fabi', 'Jesiotr', 'Diego'];
  // Shuffle the default names
  const shuffledNames = [...defaultNames];
  shuffle(shuffledNames);
  
  // Get all input elements and assign the shuffled names
  const inputs = document.querySelectorAll("#name-inputs input");
  inputs.forEach((input, index) => {
    input.value = shuffledNames[index % defaultNames.length];
  });
}

function startAssignment() {
  const inputs = document.querySelectorAll("#name-inputs input");
  names = Array.from(inputs).map(input => input.value.trim()).filter(name => name !== "");

  if (names.length !== numNames) {
    alert(`Please enter exactly ${numNames} names.`);
    return;
  }

  shuffle(names);

  // Create room assignment pattern
  const roomIndices = [];
  const baseAssignments = Math.floor(numNames / numRooms);
  const extraAssignments = numNames % numRooms;

  // Distribute names evenly across rooms
  for (let i = 0; i < numRooms; i++) {
    const assignmentsForRoom = baseAssignments + (i < extraAssignments ? 1 : 0);
    for (let j = 0; j < assignmentsForRoom; j++) {
      roomIndices.push(i);
    }
  }
  shuffle(roomIndices);

  assignments = names.map((name, i) => ({
    name: name,
    room: roomIndices[i]
  }));

  document.getElementById("input-section").classList.add("hidden");
  document.getElementById("assignment-section").classList.remove("hidden");
}

function assignNext() {
  if (index >= assignments.length) {
    document.getElementById("status").textContent = "All names assigned!";
    document.getElementById("restart-button").classList.remove("hidden");
    document.getElementById("save-button").classList.remove("hidden");
    triggerConfetti();
    return;
  }

  const { name, room } = assignments[index];
  const roomElement = document.querySelector(`#room${room + 1} ul`);
  const li = document.createElement("li");
  li.textContent = name;
  roomElement.appendChild(li);

  document.getElementById("status").textContent = `${name} assigned to Room ${room + 1}`;
  playAssignSound();
  index++;
}

function saveAssignments() {
  // Create an object to store the current state
  const saveData = {
    timestamp: new Date().toISOString(),
    numNames: numNames,
    numRooms: numRooms,
    assignments: assignments,
    currentIndex: index,
    rooms: Array.from(document.querySelectorAll('.room')).map(room => ({
      id: room.id,
      title: room.querySelector('h3').textContent,
      names: Array.from(room.querySelectorAll('li')).map(li => li.textContent)
    }))
  };

  // Convert to JSON string
  const jsonString = JSON.stringify(saveData, null, 2);
  
  // Create a blob and download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `room-assignments-${new Date().toISOString().split('T')[0]}.json`;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 