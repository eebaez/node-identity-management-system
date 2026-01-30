/* I chose argon2 as it considered the strongest 
* and has been recommended by the OWASP foundation.
*/
const argon2 = require("argon2");

const userAuthentication = async (username, password) => {
    /* Goal: Authenticate User with incoming credentials
    *
    * Important Considerations
    * - choose a robust solution to hash the incoming password
    * - hashed passwords must not be reversible.
    * - stored credentials must not be exposed
    * - prevent credential exposure by providing a limited response (auth: true|false)
    */

    const authResult = {
        authenticated: false,
        message: "Invalid Username or Password"
    };

    try {
        /* TODO: implement call to the database,
        *       seach for username and return storedHashed for comparison
        *
        * Example code calling a MongoDB Database:
        *   const userResult = await usersDB.findOne({ "username": username })
        *                               .project({ storedHashed: 1 });
        */
        const userResult = null;

        if(userResult && await argon2.verify(userResult.storedHashed, password)) {
            // password match
            authResult.authenticated = true;
            authResult.message = "";
        }
    
    } catch(err) {
        console.error(err);
    }

    return authResult;
};

module.exports = {
    userAuthentication
};
