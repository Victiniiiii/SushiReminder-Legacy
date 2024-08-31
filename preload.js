const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');

contextBridge.exposeInMainWorld('electron', {
    saveReminder: (reminder) => {
        const remindersPath = './reminders.json';
        let reminders = JSON.parse(fs.readFileSync(remindersPath, 'utf-8'));

        reminders.push(reminder);
        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
    },
    calculateRemainingTime: (date) => {
        const targetDate = new Date(date);
        const now = new Date();
        const diff = targetDate - now;
        const minutes = Math.floor(diff / 1000 / 60);
        return `${minutes} minutes remaining`;
    }
});
