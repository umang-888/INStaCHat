import RegisterAndLogin from "./RegisterAndLogin.jsx"; 
import { useContext } from "react";
import { UserContext } from "./UserContext.jsx";


export default function Routes(){
    const {username, id} = useContext(UserContext);

    if (username){ 
        return 'logged in!' + username;
    }

    
    return(
        <RegisterAndLogin/>
    );
}