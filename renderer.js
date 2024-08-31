const fs = require("fs");
const path = require("path");

document.addEventListener("DOMContentLoaded", () => {
    loadReminders();
    document.querySelector(".tab-button").click(); // Default to the first tab

    document.getElementById("createReminderBtn").addEventListener("click", showModal);
    document.querySelector(".close-btn").addEventListener("click", closeModal);
});

const remindersPath = path.join(__dirname, "reminders.json");

function loadReminders() {
    let reminders = [];
    try {
        reminders = JSON.parse(fs.readFileSync(remindersPath, "utf-8"));
    } catch (error) {
        console.error("Error reading reminders:", error);
    }

    const oneTimeContainer = document.getElementById("oneTimeReminders");
    const repeatedContainer = document.getElementById("repeatedReminders");

    // Clear existing reminders
    oneTimeContainer.innerHTML = "";
    repeatedContainer.innerHTML = "";

    reminders.forEach((reminder) => {
        const reminderElement = document.createElement("div");
        reminderElement.textContent = `${reminder.name} - ${reminder.remainingTime}`;

        if (reminder.category === "one-time") {
            oneTimeContainer.appendChild(reminderElement);
        } else if (reminder.category === "repeated") {
            repeatedContainer.appendChild(reminderElement);
        }
    });
}

function saveReminder() {
    const reminderName = document.getElementById("reminderName").value;
    const reminderCategory = document.getElementById("reminderCategory").value;
    const reminderDate = document.getElementById("reminderDate").value;

    const newReminder = {
        name: reminderName,
        category: reminderCategory,
        date: reminderDate,
        remainingTime: calculateRemainingTime(reminderDate),
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
    loadReminders(); // Refresh UI after saving
}

function calculateRemainingTime(date) {
    const targetDate = new Date(date);
    const now = new Date();
    const diff = targetDate - now;
    const minutes = Math.floor(diff / 1000 / 60);
    return `${minutes} minutes remaining`;
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

window.onclick = function(event) {
    const modal = document.getElementById("reminderModal");
    if (event.target === modal) {
        closeModal();
    }
}
