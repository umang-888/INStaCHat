import { useEffect, useState, useContext, useRef} from "react";
import Avatar from "./Avatar";
import { UserContext } from "./UserContext";
import {uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";
// import { connect } from "mongoose";


export default function Chat(){
    const [ws,setWs] = useState(null);
    const [onlinePeople, setOnlinepeople] = useState({});
    const [offlinePeople,setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setnewMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const {username, id,setId, setUsername} = useContext(UserContext);
    const divUnderMessages = useRef();
    
    useEffect(() => {
       connectToWs();
    },[]);

    function connectToWs(){
        const ws = new WebSocket('ws://localhost:4000');
        setWs(ws);
        ws.addEventListener('message',handleMessage);
        //reconnect to the WebSocket itself automatically
        ws.addEventListener('close', ()=> {
            setTimeout(()=>{
                console.log('reconnecting');
                connectToWs();
            }, 1000);
        });
    }

    function showOnlinePeople(peopleArray){
        const people = {};
        peopleArray.forEach(({userId, username}) =>{
            people[userId]= username;
        });
        setOnlinepeople(people);
    }
    function handleMessage(ev){
        const messageData = JSON.parse(ev.data);
        console.log({ev,messageData});
        if ('online' in messageData){
            showOnlinePeople(messageData.online);
        }else if ('text' in messageData){
            setMessages(prev => ([...prev,{...messageData}]));
        }
    }

    function logout(){
        axios.post('/logout').then(()=>{
            setWs(null);
            setId(null);
            setUsername(null);
        });
    }

    function sendMessage(ev){
        ev.preventDefault();
        console.log('sending');
        ws.send(JSON.stringify({
            recipient : selectedUserId,
            text : newMessageText,         
        }));

        setnewMessageText('');
        setMessages(prev =>([...prev,{
            text: newMessageText, 
            sender:id,
            recipient: selectedUserId,
            _id: Date.now(),
        }]));
        
    }
    //scroll to the bottom function
    useEffect(()=>{
        const div = divUnderMessages.current;
        if(div){ 
            div.scrollIntoView({behavior:'smooth', block:'end'});
        }
    },[messages]);
    
    useEffect(()=>{
        axios.get('/people').then(res=>{
            const offlinePeopleArr = res.data
                .filter(p=>p._id !== id)
                .filter(p=> !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople ={};
            offlinePeopleArr.forEach(p=>{
                offlinePeople[p._id] = p;
            });
            setOfflinePeople(offlinePeople);

        });//get all people
        
    },[onlinePeople]);

    //fetch from the history from database
    useEffect(() => {
        if (selectedUserId){
            axios.get('/messages/' + selectedUserId).then(res =>{
                setMessages(res.data);
            });
        } 
    }, [selectedUserId]);


    const onlinePeopleExclOurUser = {...onlinePeople};
    delete onlinePeopleExclOurUser[id];
    
    //we found out our message will always duplicate, this function help solves the problem
    const messageWithoutDupes = uniqBy(messages, '_id');

    return(
        <div className="flex h-screen">
            <div className="bg-white-100 w-1/3 flex flex-col">
                <div className="flex-grow">
                    <div className="text-blue-600 font-bold flex gap-2 mb-4 p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                        </svg>
                        Mern-Chat
                    </div>
                    
                    {Object.keys(onlinePeopleExclOurUser).map(userId =>(
                        <Contact 
                            key = {userId}
                            id = {userId}
                            online = {true}
                            username={onlinePeopleExclOurUser[userId]}
                            onClick={()=> setSelectedUserId(userId)}
                            selected = {userId === selectedUserId}/>
                    ))}
                    {Object.keys(offlinePeople).map(userId =>(
                        <Contact 
                            key = {userId}
                            id = {userId}
                            online = {false}
                            username={offlinePeople[userId].username}
                            onClick={()=> setSelectedUserId(userId)}
                            selected = {userId === selectedUserId}/>
                    ))}
                </div>
                
                <div className="p-2 text-center flex items-center justify-center">
                    <span className=" mr-2 text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-6">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </span>
                    <button onClick={logout} className="text-sm bg-blue-100 py-1 px-2 text-gray-600 border rounded-sm">Logout</button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-300 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">&larr; No Selected User, select from the sidebar</div>
                        </div>
                    )}
                    {!!selectedUserId &&(
                        <div className="relative h-full">
                            <div  className="overflow-y-scroll absolute inset-0">
                                {messageWithoutDupes.map(message =>(
                                    <div key ={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}> 
                                        <div className={"text-left inline-block p-2 m-2 rounded-md text-sm "+ (message.sender ===id ? 'bg-blue-500 text-white': 'bg-white text-gray-500') }> 
                                            {/* sender: {message.sender}<br/>
                                            my id: {id}<br/> */}
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages}></div>
                            </div>

                        </div>
                        
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2 mx-2" onSubmit={(sendMessage)}>
                        <input type="text" 
                            value ={newMessageText}
                            onChange={ev => setnewMessageText(ev.target.value)}
                            placeholder="Type your message here" 
                            className="bg-white flex-grow border rounded-sm p-2"/>
                        <button className="bg-blue-500 p-2 rounded-sm text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}