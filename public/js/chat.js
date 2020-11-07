const socket = io();

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocation = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options
const {username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild;

    // height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of message container 
    const containerHeight = $messages.scrollHeight;

    // how far I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// receive message from server
socket.on('message', (data) => {
    console.log(data);
    const html = Mustache.render(messageTemplate, {
        username: data.userName,
        message: data.text,
        createdAt: moment(data.createdAt).format('h:mm A')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('locationMessage', (location) => {
    console.log(location);
    const html = Mustache.render(locationTemplate, {
        username: location.userName,
        locationUrl: location.url,
        createdAt: moment(location.createdAt).format('h:mm A')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;

    
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  $messageFormButton.setAttribute('disabled', 'disabled')

  let newMessage = e.target.elements.chatmessage.value;

  // send chat message to server
  socket.emit('sendMessage', newMessage, (error) => {

    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus()

    if(error) {
        return console.log(error);
    }
    console.log('Message Delivered!');
  });
});

$sendLocation.addEventListener('click', () => {
     if(!navigator.geolocation) {
         return alert('Geolocation is not supported by the browser');
     }

    $sendLocation.setAttribute('disabled', 'disabled');

     navigator.geolocation.getCurrentPosition((position) =>  {

        // share location to the server
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocation.removeAttribute('disabled');
            console.log('Location Shared!');
        });
     });
})

socket.emit('join', { username, room}, (error) => {
  if(error) {
      alert(error);
      location.href = '/'
  }  
})