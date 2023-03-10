import {
  Box,
  Button,
  FormControl,
  IconButton,
  Input,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";
import { debounce } from "lodash";
import React, { useCallback, useEffect, useState } from "react";
import { ChatState } from "../../context/chatProvider";
import Messages from "./Messages";
const audio = new Audio("/assets/sounds/ding.mp3");

const ChatBoxBody = ({ sendLiveMessage, updateTheChatList, socket }) => {
  const chatState = ChatState();
  const [message, setMessage] = useState("");
  const [loadingStates, setLoadingStates] = useState({ msgLoading: false });
  const [messageList, setMessageList] = useState([]);
  const messageInputHandler = async (msg) => {
    setMessage(msg);
    //console.log(msg);
  };
  //useEffect(() => {
  socket.on("get-message", (messageData) => {
    console.log("got message", messageData);
    if (messageData.chat._id === chatState.selectedChat?._id) {
      setMessageList([...messageList, messageData]);
    }
    updateTheChatList(messageData);
    console.log("playing audio...");
    audio.play();
    console.log("played audio audio...");
  });
  //}, [socket]);

  const toast = useToast();
  useEffect(() => {
    setLoadingStates({ ...loadingStates, msgLoading: true });
    setMessageList([]);
    delayedFetchMessages(chatState.selectedChat);
    //setMessageList(data);
  }, [chatState.selectedChat]);
  // useEffect(() => {
  //   setMessageList(messageList);
  // }, [messageList]);
  const delayedFetchMessages = useCallback(
    debounce((currentChat) => {
      fetchMessages(currentChat);
    }, 2000),
    []
  );
  const fetchMessages = (currentChat) => {
    try {
      setMessageList([]);
      // console.log(
      //   "requesting for ",
      //   currentChat?.isGroupChat
      //     ? currentChat?.chatName
      //     : currentChat?.users[0].name + "," + currentChat?.users[1].name
      // );
      const { data } = axios
        .get(`/api/message/${currentChat._id}`, {
          headers: {
            Authorization: `Bearer ${chatState.user.token}`,
          },
        })
        .then(({ data }) => {
          if (data.length > 0 && data[0].chat._id === currentChat._id) {
            setMessageList(data);
          }
          setLoadingStates({ ...loadingStates, msgLoading: false });
        })
        .catch((error) => {
          toast({
            status: "error",
            title: error.message,
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        });
      //if (data.length > 0 && data[0].chat._id === chatState.selectedChat._id)

      //console.log("controller::" + controller);
      // console.log(
      //   "data for ",
      //   currentChat?.isGroupChat
      //     ? currentChat?.chatName
      //     : currentChat?.users[0].name + "," + currentChat?.users[1].name
      // );
    } catch (error) {
      toast({
        status: "error",
        title: error.message,
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
    }
  };

  const handleSend = (msg) => {
    if (!msg) {
      msg = message;
    }

    try {
      if (!msg || !msg.trim()) {
        throw new Error("Please enter the message first");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${chatState.user.token}`,
        },
      };
      const reqBody = {
        content: msg,
        sender: chatState.user._id,
        chat: chatState.selectedChat._id,
      };

      axios
        .post("/api/message/send", reqBody, config)
        .then(({ data }) => {
          setMessageList([...messageList, data]);
          updateTheChatList(data);
          sendLiveMessage(data);
        })
        .catch((error) => {
          toast({
            status: "error",
            title: error.message,
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        });
    } catch (error) {
      toast({
        status: "error",
        title: error.message,
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setMessage("");
    }
  };
  return (
    <Box height={"90%"} position="relative" overflowY={"hidden"}>
      <Messages
        messageList={messageList}
        messagesLoading={loadingStates.msgLoading}
      />
      <FormControl
        position="absolute"
        bottom="3%"
        display={"flex"}
        paddingLeft="2%"
        paddingRight={"2%"}
      >
        <Input
          placeholder="Type a message..."
          backgroundColor="white"
          value={message}
          onChange={(e) => {
            messageInputHandler(e.target.value);
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              handleSend(e.target.value);
            }
          }}
        />
        <IconButton
          backgroundColor={"whatsapp.500"}
          color="white"
          borderRadius={"full"}
          _hover={{ color: "whatsapp.500", backgroundColor: "#e8e8e8" }}
          onClick={() => {
            handleSend();
          }}
        >
          <i className="fa-solid fa-paper-plane"></i>
        </IconButton>
      </FormControl>
    </Box>
  );
};

export default ChatBoxBody;
