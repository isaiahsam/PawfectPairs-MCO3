// Function to fetch data from the server
let data;

// Function to fetch data from the server
async function fetchDataFromServer() {
  try {
    const response = await fetch('/getData'); // Assumes your server is running on the same domain/port
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    // Call any function you need with the retrieved data
    processData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Function to process the retrieved data and save it to the profiles array
function processData(data) {
  // Assuming the fetched data is an array
  profiles = data;
  console.log(profiles); // Display the data to verify
  console.log("whahahha");
  updateSwipeCard();
  // Now you can use the profiles array in your script for further processing or rendering
}

const dogNameInput = $('#dog-name');
const breedInput = $('#breed');
const ownerNameInput = $('#owner-name');
const locationInput = $('#location');
const editButton = $('#edit-button');

// Function to enable editing of the profile
function enableProfileEditing() {
  dogNameInput.removeAttr('readonly');
  breedInput.removeAttr('readonly');
  ownerNameInput.removeAttr('readonly');
  locationInput.removeAttr('readonly');
  editButton.text('Save');
  editButton.off('click');
  editButton.click(saveProfile);
}

// Function to save the profile changes
function saveProfile() {
  const dogName = dogNameInput.val();
  const breed = breedInput.val();
  const ownerName = ownerNameInput.val();
  const location = locationInput.val();

  // Perform saving of the profile here

  // Disable editing and update the display
  disableProfileEditing();
}

// Function to disable editing of the profile
function disableProfileEditing() {
  dogNameInput.attr('readonly', 'readonly');
  breedInput.attr('readonly', 'readonly');
  ownerNameInput.attr('readonly', 'readonly');
  locationInput.attr('readonly', 'readonly');
  editButton.text('Edit');
  editButton.off('click');
  editButton.click(enableProfileEditing);
}

// Initial state - Profile is not editable
disableProfileEditing();

const chatList = $('.chat-list');
const chatContainer = $('#chat-container');
const chatView = $('#chat-view');
const chatMessages = $('#chat-messages');
const messageInput = $('#message-input');
const sendButton = $('#send-button');

// Sample Chat Data
const chats = [{
  name: 'John Doe',
  avatar: 'image/dogs/dog1.jpg',
  messages: [
    'Hey, how are you doing?',
    'Did you go for a walk today?',
    'Looking forward to our next playdate!',
  ],
},
{
  name: 'Isaiah',
  avatar: 'image/dogs/dog4.png',
  messages: [
    'Did you go for a walk today?',
    'Looking forward to our next playdate!',
  ],
},
  // Add more chat data here
];

// Function to display chat messages
function displayChatMessages(messages) {
  chatMessages.empty();
  messages.forEach(function (message) {
    const chatMessage = $('<div class="chat-message"></div>');
    chatMessage.text(message);
    chatMessages.append(chatMessage);
  });
}

// Function to open a chat conversation
function openChat(index) {
  const chat = chats[index];
  chatContainer.show();
  chatView.show();
  displayChatMessages(chat.messages);
}

// Function to handle sending a message
function sendMessage() {
  const message = messageInput.val();
  if (message.trim() !== '') {
    const chatMessage = $('<div class="chat-message"></div>');
    chatMessage.text(message);
    chatMessages.append(chatMessage);
    messageInput.val('');
  }
}

// Populate chat list
chats.forEach(function (chat, index) {
  const chatItem = $('<div class="chat-item"></div>');
  const chatHeader = $('<div class="chat-header"></div>');
  const chatAvatar = $('<img src="' + chat.avatar + '" alt="User Avatar" class="chat-avatar">');
  const chatInfo = $('<div class="chat-info"></div>');
  const chatName = $('<h4 class="chat-name">' + chat.name + '</h4>');
  const chatTimestamp = $('<p class="chat-timestamp">2 hours ago</p>');

  chatHeader.append(chatAvatar);
  chatInfo.append(chatName);
  chatInfo.append(chatTimestamp);
  chatHeader.append(chatInfo);
  chatItem.append(chatHeader);

  chatItem.click(function () {
    openChat(index);
  });

  chatList.append(chatItem);
});

// Send button click event
sendButton.click(function () {
  sendMessage();
});

// Enter key press event
messageInput.keypress(function (event) {
  if (event.which === 13) {
    sendMessage();
  }
});



// Sample Profiles
let profiles = fetchDataFromServer();;

let currentProfileIndex = 1;

const swipeCard = $('#swipeCard');
const swipeDogImage = $('#swipeDogImage');
const swipeDogName = $('#swipeDogName');
const swipeBreed = $('#swipeBreed');
const swipeOwnerName = $('#swipeOwnerName');
const swipeLocation = $('#swipeLocation');
const swipeAbout = $('#swipeAbout');

function updateSwipeCard() {
  const profile = profiles[currentProfileIndex];
  swipeDogImage.attr('src', "/image/uploads/" + profile.petImage);
  swipeDogName.text(profile.dogName);
  swipeBreed.text(profile.dogBreed);
  swipeOwnerName.text(profile.ownerName);
  swipeLocation.text(profile.location);
  swipeAbout.text(profile.about);
  swipeCard.removeClass('swipe-left swipe-right'); // Remove animation class
  console.log("Swipe Card Updated");
}

function swipeLeft() {
  swipeCard.addClass('swipe-left'); // Add animation class
  setTimeout(function () {
    currentProfileIndex++;
    if (currentProfileIndex >= profiles.length) {
      currentProfileIndex = 0;
    }
    updateSwipeCard();
  }, 300);
}

function swipeRight() {
  swipeCard.addClass('swipe-right'); // Add animation class
  setTimeout(function () {
    currentProfileIndex++;
    if (currentProfileIndex >= profiles.length) {
      currentProfileIndex = 0;
    }
    updateSwipeCard();
  }, 300);
}


$('.swipe-left-btn').on('click', swipeLeft);
$('.swipe-right-btn').on('click', swipeRight);
