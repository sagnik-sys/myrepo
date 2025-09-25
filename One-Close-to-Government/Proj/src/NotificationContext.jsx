import { createContext, useState, useEffect } from "react";


export const NotificationContext = createContext();


export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);


  // Load saved notifications from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notifications")) || [];
    setNotifications(saved);
  }, []);


  // Update localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);


  // Add a new notification
  const addNotification = (message) => {
    const newNote = { id: Date.now(), message };
    setNotifications((prev) => [...prev, newNote]);
  };
 

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};