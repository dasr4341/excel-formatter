function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
}
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "859948786595-fm85feuvhu7mn4867l493vshhfe0mr5n.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large" }  // customization attributes
    );
    google.accounts.id.prompt(); // also display the One Tap dialog
}


// import jwt from 'jsonwebtoken';


// function parseJwt(token) {
//   var base64Payload = token.split('.')[1];
//   var payload = Buffer.from(base64Payload, 'base64');
//   return JSON.parse(payload.toString());
// }

// a.aud = '166078394055-u9ncol6fjojcld3vdb21hi2mg3mkfu7r.apps.googleusercontent.com';
// a.azp = '166078394055-u9ncol6fjojcld3vdb21hi2mg3mkfu7r.apps.googleusercontent.com';


// const JWT_SECRET_KEY = String('60407fc0-e528-4c10-8203-671bd94af45b');

//  const token = jwt.sign({
//        a
//     }, JWT_SECRET_KEY, { expiresIn: '1d' }, { algorithm: 'RS256', keyid: '986ee9a3b7520b494df54fe32e3e5c4ca685c89d' });
    
// console.log('a', a);
// console.log('token', token);