function handleCredentialResponse(response) {
          console.log("Encoded JWT ID token: " + response.credential);
        }
        window.onload = function () {
            google.accounts.id.initialize({
            // client_id: "859948786595-fm85feuvhu7mn4867l493vshhfe0mr5n.apps.googleusercontent.com",
            client_id: "166078394055-u9ncol6fjojcld3vdb21hi2mg3mkfu7r.apps.googleusercontent.com",
            callback: handleCredentialResponse
          });
          google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "outline", size: "large" }  // customization attributes
          );
          google.accounts.id.prompt(); // also display the One Tap dialog
        }