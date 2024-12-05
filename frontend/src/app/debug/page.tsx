"use client";
import styles from "./page.module.css";
import { io } from "socket.io-client";
import { useState } from "react";
import ChatPage from "@/app/ui/debug";

export default function Page() {

    const [userName, setUserName] = useState("");
    const [roomId, setroomId] = useState("");
    const [showSpinner, setShowSpinner] = useState(false);
    const [showChat, setShowChat] = useState(false);


    const handleJoin = () => {
        if (userName !== "" && roomId !== "") {
            console.log(userName, "userName", roomId, "roomId");
            socket.emit("join_room", roomId);
            setShowSpinner(true);
            // You can remove this setTimeout and add your own logic
            setTimeout(() => {
                setShowChat(true);
                setShowSpinner(false);
            }, 4000);
        } else {
            alert("Please fill in Username and Room Id");
        }
    };

    var socket: any;
    socket = io("http://localhost:3001");






    return (
        <div>
          <div
            className={styles.main_div}
            style={{ display: showChat ? "none" : "" }}
          >
            <input
              className={styles.main_input}
              type="text"
              placeholder="Username"
              onChange={(e) => setUserName(e.target.value)}
              disabled={showSpinner}
            />
            <input
              className={styles.main_input}
              type="text"
              placeholder="room id"
              onChange={(e) => setroomId(e.target.value)}
              disabled={showSpinner}
            />
            <button className={styles.main_button} onClick={() => handleJoin()}>
              {!showSpinner ? (
                "Join"
              ) : (
                <div className={styles.loading_spinner}></div>
              )}
            </button>
          </div>
          <div style={{ display: !showChat ? "none" : "" }}>
            <ChatPage socket={socket} roomId={roomId} username={userName} />
          </div>
        </div>
      );
    }