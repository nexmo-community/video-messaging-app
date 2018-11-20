const OT = require('@opentok/client');
const ConversationClient = require('nexmo-stitch');

const session = OT.initSession(opentokApiKey, opentokSessionId);
const publisher = OT.initPublisher('publisher');

session.on({
  streamCreated: (event) => {
    const subscriberClassName = `subscriber-${event.stream.streamId}`;
    const subscriber = document.createElement('div');
    subscriber.setAttribute('id', subscriberClassName);
    document.getElementById('subscribers').appendChild(subscriber);
    session.subscribe(event.stream, subscriberClassName);
   },
  streamDestroyed: (event) => {
    console.log(`Stream ${event.stream.name} ended because ${event.reason}.`);
   },
   sessionConnected: event => {
     session.publish(publisher);    
   },
});

session.connect(opentokToken, (error) => {
  if (error) {
    console.log('error connecting to session');
  }
});

class ChatApp {
  constructor() {
    this.messageTextarea = document.getElementById('messageTextarea');
    this.messageFeed = document.getElementById('messageFeed');
    this.sendButton = document.getElementById('send');
    this.loginForm = document.getElementById('login');
    this.setupUserEvents();
  }

  errorLogger(error) {
    console.log(`There was an error ${JSON.stringify(error)}`);
  }

  eventLogger(event) {
    console.log(`This event happened: ${event}`);
  }

  setupConversationEvents(conversation) {
    this.conversation = conversation;    
    console.log('*** Conversation Retrieved', conversation)
    console.log('*** Conversation Member', conversation.me)

    conversation.on('text', (sender, message) => {
      console.log('*** Message received', sender, message)
      const date = new Date(Date.parse(message.timestamp))
      const text = `${sender.user.name} @ ${date}: <b>${message.body.text}</b><br>`
      this.messageFeed.innerHTML = text + this.messageFeed.innerHTML
    });
    this.showConversationHistory(conversation);
  }

  joinConversation(userToken) {
    new ConversationClient({
      debug: false
    })
    .login(userToken)
    .then(app => {
      console.log('*** Logged into app', app)
      return app.getConversation(nexmoConversationId)
    })
    .then(this.setupConversationEvents.bind(this))
    .catch(this.errorLogger)
  }

  setupUserEvents() {
    this.sendButton.addEventListener('click', () => {
      this.conversation.sendText(this.messageTextarea.value).then(() => {
          this.eventLogger('text')
          this.messageTextarea.value = ''
      }).catch(this.errorLogger)
  })
  this.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      document.getElementById('messages').style.display = 'block';
      document.getElementById('login').style.display = 'none';
      console.log('nexmo JWT', nexmoJWT);
      this.joinConversation(nexmoJWT);
   });
  }
  
  showConversationHistory(conversation) {
    conversation.getEvents().then((events) => {
      var eventsHistory = ""
  
      events.forEach((value, key) => {
        if (conversation.members.get(value.from)) {
          const date = new Date(Date.parse(value.timestamp))
          switch (value.type) {
            case 'text:seen':
              break;
            case 'text:delivered':
              break;
            case 'text':
              eventsHistory = `${conversation.members.get(value.from).user.name} @ ${date}: <b>${value.body.text}</b><br>` + eventsHistory
              break;
  
            case 'member:joined':
              eventsHistory = `${conversation.members.get(value.from).user.name} @ ${date}: <b>joined the conversation</b><br>` + eventsHistory
              break;
            case 'member:left':
              eventsHistory = `${conversation.members.get(value.from).user.name} @ ${date}: <b>left the conversation</b><br>` + eventsHistory
              break;
            case 'member:invited':
              eventsHistory = `${conversation.members.get(value.from).user.name} @ ${date}: <b>invited to the conversation</b><br>` + eventsHistory
              break;
  
            default:
              eventsHistory = `${conversation.members.get(value.from).user.name} @ ${date}: <b>unknown event</b><br>` + eventsHistory
          }
        }
      })
  
      this.messageFeed.innerHTML = eventsHistory + this.messageFeed.innerHTML
    })
  }
}

window.onload = () => {
  new ChatApp();
}
