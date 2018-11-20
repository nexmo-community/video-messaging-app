const OpenTok = require('opentok');
const Nexmo = require('nexmo');
const express = require('express');
const { 
  opentokApiKey,
  opentokApiSecret,
  nexmoApiKey,
  nexmoApiSecret,
  nexmoApplicationId,
  nexmoPrivateKey,
  nexmoConversationId,
  } = require('./config');

const app = express();
app.use(express.static(`${__dirname}/public`));

const opentok = new OpenTok(opentokApiKey, opentokApiSecret);
const nexmo = new Nexmo({
 apiKey: nexmoApiKey,
 apiSecret: nexmoApiSecret,
 applicationId: nexmoApplicationId,
 privateKey: nexmoPrivateKey,
});

app.get('/', (req, res) => {
  opentok.createSession({
    mediaMode: 'routed'
  }, (error, session) => {
    if (error) {
      res.status(500).send('There was an error generating an OpenTok session');
    } else {
      const opentokSessionId = session.sessionId;
      const opentokToken = opentok.generateToken(opentokSessionId);
      const nexmoJWT = nexmo.generateJwt({
        exp: new Date().getTime() + 86400,
        acl: {
          "paths": {
            "/v1/users/**": {},
            "/v1/conversations/**": {},
            "/v1/sessions/**": {},
            "/v1/devices/**": {},
            "/v1/image/**": {},
            "/v3/media/**": {},
            "/v1/applications/**": {},
            "/v1/push/**": {},
            "/v1/knocking/**": {}
          }
        },
        sub: 'jamie'
      });
      res.render('index.ejs', {
        opentokApiKey,
        opentokSessionId,
        opentokToken,
        nexmoConversationId,
        nexmoJWT,
      });
    }
  });
});

const PORT  = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running server on PORT: ${PORT}`));
