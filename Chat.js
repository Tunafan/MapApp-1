// Chat.js
import React, { useState, useEffect, useCallback } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Chat() {
  const [messages, setMessages] = useState([]);

  // Load messages from AsyncStorage on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem("chatMessages");
        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };
    loadMessages();
  }, []);

  // Save messages to AsyncStorage whenever they update
  useEffect(() => {
    const saveMessages = async () => {
      try {
        await AsyncStorage.setItem("chatMessages", JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
    };
    saveMessages();
  }, [messages]);

  // Handle sending a new message
  const onSend = useCallback((newMessages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: 1,
        name: "User",
      }}
    />
  );
}
