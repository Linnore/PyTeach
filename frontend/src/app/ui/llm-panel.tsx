'use client'
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// LLMPanel functions, task specified in backend/jupyterlite-iframe-server/dev/src/index.ts
function changeTheme() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "changeTheme" }, "*");
}

function debug() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "debug" }, "*");
}

function explain() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "explain" }, "*");
}

function comment() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "comment" }, "*");
}

function getActiveCellContent() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "getActiveCellContent" }, "*");
}

function getContentsAllCells() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "getContentsAllCells" }, "*");
}

function addCommentsToActiveCell() {
    window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "addCommentsToActiveCell" }, "*");
}

function extractAndSaveCell(cellIndexArray: number[], File_path: string, playSound: boolean) {
    console.log("play sound", playSound);
    const message = {
      type: 'from-host-to-iframe',
      task: 'extractAndSaveCell',
      message: {
        cellIndexArray: cellIndexArray,
        sourceFile: File_path,
        playSound: playSound,
      }
    };
  
    window.frames[0].postMessage(message, "*");
  }

interface SocketToHostDataType {
    task: String;
    source_id: String;
    source_type: String;
    newContent: String;
}

// LLMPanel
const LLMPanel = ({ socket, host_info, sourceFile, indexArray}: any) => {
    const [subArrayIndex, setSubArrayIndex] = useState(0);
    const [playSound, setPlaySound] = useState(false);
    const handleExtractAndSaveCell = () => {
        const subArray = indexArray[subArrayIndex];
        if (subArrayIndex === indexArray.length) {
            console.error('This chapter has ended!');
            return;
        } else {
            extractAndSaveCell(subArray, sourceFile, playSound);
            setSubArrayIndex(prevIndex => prevIndex + 1);
        }
    };

    useEffect(() => {
        socket.on("from_socket_to_host", (data: SocketToHostDataType) => {
            console.log('Hostpage INFO:\t', data.source_type, data.source_id, 'to socket to hostpage. Task=', data.task);
            if (data.task == "changeTheme") {
                window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "changeTheme", target_id: `${data.source_type}${data.source_id}` }, "*");
            }
        });
    }, [socket]);
    useEffect(() => {
        function socket_handler(data: SocketToHostDataType) {
            console.log('Hostpage INFO:\t', data.source_type, data.source_id, 'to socket to hostpage. Task=', data.task);
            if (data.task == "changeTheme") {
                window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "changeTheme", target_id: `${data.source_type}${data.source_id}` }, "*");
            }
            if (data.task == "getActiveCellContent") {
                window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "getActiveCellContent", target_id: `${data.source_type}${data.source_id}` }, "*");
            }
            if (data.task == "getContentsAllCells") {
                window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "getContentsAllCells", target_id: `${data.source_type}${data.source_id}` }, "*");
            }
            if (data.task == "writeContentToCell") {
                window.frames[0].postMessage({ type: 'from-host-to-iframe', task: "writeContentToCell", target_id: `${data.source_type}${data.source_id}`, newContent: `${data.newContent}` }, "*");
            }
        }
        socket.on("from_socket_to_host", socket_handler);
        return () => {
            socket.off("from_socket_to_host", socket_handler)
        }
    }, [socket]);


    // window.addEventListener('message', (event) => {
    //     // react to events
    //     if (event.data.type === 'from-iframe-to-host') {
    //         // TODO: combine the info from jupyterlite, host_info, and other messages to help
    //         var jupyterlite_info = { jupyterlite_info: event.data }
    //         var target_id = event.data.target_id;
    //         if (event.data.task == 'notifyThemeChanged') {
    //             let host_msg = { message: "Theme Changed!" }
    //             socket.emit("from_host_to_socket", { ...host_info, ...host_msg, ...jupyterlite_info, target_id: target_id })
    //         }
    //     }
    // });

    window.addEventListener('message', (event) => {
        // react to events
        if (event.data.type === 'from-iframe-to-host') {
            // TODO: combine the info from jupyterlite, host_info, and other messages to help
            var jupyterlite_info = { jupyterlite_info: event.data }
            var target_id = event.data.target_id;
            if (event.data.task == 'notifyThemeChanged') {
                let host_msg = { message: "Theme Changed!" }
                socket.emit("from_host_to_socket", { ...host_info, ...host_msg, ...jupyterlite_info, target_id: target_id })
            }
            if (event.data.task == 'getActiveCellContent') {
                let host_msg = { message: "Retrieved active cell content." }
                socket.emit("from_host_to_socket", { ...host_info, ...host_msg, ...jupyterlite_info, target_id: target_id })
            }
            if (event.data.task == 'getContentsAllCells') {
                let host_msg = { message: event.data.AllCellscontent }
                console.log(event.data.AllCellscontent)
                socket.emit("from_host_to_socket", { ...host_info, ...host_msg, ...jupyterlite_info, target_id: target_id })
            }
            if (event.data.task == 'writeContentToCell') {
                let host_msg = { message: 'Successfully write content to a new cell.'}
                socket.emit("from_host_to_socket", { ...host_info, ...host_msg, ...jupyterlite_info, target_id: target_id })
            }
        }
    });

    return (
        <div className="flex flex-col">
            <div className="bg-white p-2 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                    <label className="mr-2">Play Sound:</label>
                    <input
                        type="checkbox"
                        checked={playSound}
                        onChange={(e) => setPlaySound(e.target.checked)}
                    />
                </div>
                {/* <h1 className={`${lusitana.className} text-2xl font-bold mb-4`}>LLM Panel</h1>*/}
                <div className="flex-wrap justify-center space-x-2 space-y-2">
                    <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => debug()}>Debug</button>
                    <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => explain()}>Explain</button>
                    <button className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => comment()}>Comment</button>
                    <button className="px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600"onClick={handleExtractAndSaveCell}>Teach</button>
                </div>
            </div>
        </div>
    );
}

export default LLMPanel;