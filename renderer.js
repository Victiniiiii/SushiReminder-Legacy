const fs = require("fs");
const path = require("path");
const remindersPath = path.join(__dirname, "reminders.json");

document.addEventListener("DOMContentLoaded", () => {
    loadReminders();
    document.querySelector(".tab-button").click();
    document.getElementById("createReminderBtn").addEventListener("click", showModal);
    document.querySelector(".close").addEventListener("click", closeModal);
    document.getElementById("settingsBtn").addEventListener("click", () => openTab(event, 'settings'));    
    document.getElementById("saveReminderBtn").addEventListener("click", saveReminder);
    document.getElementById("reminderCategory").addEventListener("change", toggleDateTime);
});

function loadReminders() {
    let reminders = [];
    try {
        reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
    } catch (error) {
        console.error("Error reading reminders:", error);
    }

    const oneTimeContainer = document.getElementById("oneTimeReminders");
    const repeatedContainer = document.getElementById("repeatedReminders");

    oneTimeContainer.innerHTML = "";
    repeatedContainer.innerHTML = "";

    reminders.forEach((reminder) => {
        const reminderElement = document.createElement("div");
        reminderElement.id = `reminder-${reminder.name}`;
        reminderElement.dataset.date = reminder.date;
        reminderElement.dataset.name = reminder.name;
        reminderElement.dataset.category = reminder.category;
        reminderElement.dataset.days = reminder.daysOfWeek ? reminder.daysOfWeek.join(',') : null;
        reminderElement.dataset.time = reminder.time;

        if (reminder.category === "repeated") {
            reminderElement.textContent = `${reminder.name} - ${calculateRemainingTimeForRepeated(reminder.daysOfWeek, reminder.time)}`;
        } else {
            reminderElement.textContent = `${reminder.name} - ${calculateRemainingTime(reminder.date)}`;
        }

        if (reminder.category === "one-time") {
            oneTimeContainer.appendChild(reminderElement);
        } else if (reminder.category === "repeated") {
            repeatedContainer.appendChild(reminderElement);
        }
    });

    setInterval(updateRemainingTimes, 1000);
}

function saveReminder() {
    const reminderName = document.getElementById("reminderName").value;
    const reminderCategory = document.getElementById("reminderCategory").value;
    const reminderDate = document.getElementById("reminderDate").value;
    const reminderTime = document.getElementById("reminderTime").value;

    let daysOfWeek = [];
    if (reminderCategory === "repeated") {
        const checkboxes = document.querySelectorAll('input[name="days"]:checked');
        checkboxes.forEach(checkbox => {
            daysOfWeek.push(checkbox.value);
        });
    }

    const newReminder = {
        name: reminderName,
        category: reminderCategory,
        date: reminderCategory === "one-time" ? `${reminderDate}T${reminderTime}` : null,
        time: reminderTime,
        daysOfWeek: reminderCategory === "repeated" ? daysOfWeek : null
    };

    let reminders = [];
    try {
        reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
    } catch (error) {
        console.error("Error reading reminders:", error);
    }

    reminders.push(newReminder);
    try {
        fs.writeFileSync(remindersPath, JSON.stringify(reminders, null, 2));
    } catch (error) {
        console.error("Error writing reminders:", error);
    }

    closeModal();
    loadReminders();
}

function calculateRemainingTime(date) {
    const targetDate = new Date(date);
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) return "Time's up!";

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let remainingTime = '';
    if (days > 0) remainingTime += `${days} days `;
    if (hours > 0 || days > 0) remainingTime += `${hours} hours `;
    if (minutes > 0 || hours > 0 || days > 0) remainingTime += `${minutes} minutes `;
    remainingTime += `${seconds} seconds remaining`;

    return remainingTime.trim();
}

function calculateRemainingTimeForRepeated(daysOfWeek, time) {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const targetTimeParts = time.split(':');
    const targetHour = parseInt(targetTimeParts[0], 10);
    const targetMinute = parseInt(targetTimeParts[1], 10);
    const targetTime = targetHour * 3600 + targetMinute * 60;

    let closestTimeDiff = Infinity;
    let closestDate = null;

    daysOfWeek.forEach(day => {
        const dayIndex = dayNames.indexOf(day);
        const dayDiff = (dayIndex - now.getDay() + 7) % 7;
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + dayDiff);
        targetDate.setHours(targetHour, targetMinute, 0, 0);

        const diff = targetDate - now;

        if (diff < closestTimeDiff) {
            closestTimeDiff = diff;
            closestDate = targetDate;
        }
    });

    if (closestTimeDiff <= 0) {
        closestDate.setDate(closestDate.getDate() + 7);
        closestTimeDiff = closestDate - now;
    }

    return calculateRemainingTime(closestDate);
}

function updateRemainingTimes() {
    const reminderElements = document.querySelectorAll('[id^="reminder-"]');
    reminderElements.forEach(element => {
        const reminderDate = element.dataset.date;
        const reminderName = element.dataset.name;
        const reminderCategory = element.dataset.category;
        const daysOfWeek = element.dataset.days ? element.dataset.days.split(',') : [];
        const time = element.dataset.time;

        let remainingTime = "";

        if (reminderCategory === "repeated") {
            remainingTime = calculateRemainingTimeForRepeated(daysOfWeek, time);
        } else {
            remainingTime = calculateRemainingTime(reminderDate);
        }

        element.textContent = `${reminderName} - ${remainingTime}`;
    });
}

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => {
        content.style.display = "none";
    });

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.className = button.className.replace(" active", "");
    });

    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

function showModal() {
    const modal = document.getElementById("reminderModal");
    modal.style.display = "block";
}

function closeModal() {
    const modal = document.getElementById("reminderModal");
    modal.style.display = "none";
}

function toggleDateTime() {
    const category = document.getElementById("reminderCategory").value;
    const dateTimeFields = document.querySelector(".datetime-container");
    const repeatedFields = document.querySelector(".repeated-container");

    if (category === "repeated") {
        dateTimeFields.style.display = "none";
        repeatedFields.style.display = "block";
    } else {
        dateTimeFields.style.display = "flex";
        repeatedFields.style.display = "none";
    }
}

window.onclick = function(event) {
    const modal = document.getElementById("reminderModal");
    if (event.target === modal) {
        closeModal();
    }
}
