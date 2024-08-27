const fs = require('fs');
const path = require('path');
const remindersFilePath = path.join(__dirname, 'reminders.json');

document.addEventListener('DOMContentLoaded', () => {
    const addReminderButton = document.getElementById('addReminder');
    const reminderModal = document.getElementById('reminderModal');
    const closeModal = document.querySelector('.close');
    const saveReminderButton = document.getElementById('saveReminder');
    const reminderList = document.getElementById('reminderList');
    const reminderTypeSelect = document.getElementById('reminderType');
    const reminderTimeInput = document.getElementById('reminderTime');
    const reminderNameInput = document.getElementById('reminderName');

    let reminders = [];

    if (fs.existsSync(remindersFilePath)) {
        const data = fs.readFileSync(remindersFilePath);
        reminders = JSON.parse(data);
        updateReminders();
    }

    reminderTypeSelect.addEventListener('change', () => {
        reminderTimeInput.style.display = reminderTypeSelect.value === 'one-time' ? 'block' : 'none';
    });

    addReminderButton.addEventListener('click', () => {
        reminderModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        reminderModal.style.display = 'none';
        clearErrorMessage();
    });

    window.onclick = function(event) {
        if (event.target == reminderModal) {
            reminderModal.style.display = 'none';
            clearErrorMessage();
        }
    };

    saveReminderButton.addEventListener('click', () => {
        const reminderName = reminderNameInput.value.trim();
        const reminderType = reminderTypeSelect.value;
        let reminderTime = null;

        clearErrorMessage();

        if (!reminderName) {
            displayErrorMessage('Please provide a name for the reminder.');
            return;
        }

        if (reminderType === 'one-time') {
            reminderTime = new Date(reminderTimeInput.value);
            if (isNaN(reminderTime.getTime())) {
                displayErrorMessage('Please select a valid date and time for the reminder.');
                return;
            }

            if (reminderTime < new Date()) {
                displayErrorMessage('The reminder time cannot be in the past.');
                return;
            }
        }

        reminders.push({ name: reminderName, type: reminderType, time: reminderTime, checked: false });
        saveRemindersToFile();
        reminderModal.style.display = 'none';
        updateReminders();
    });

    function updateReminders() {
        reminderList.innerHTML = '';
    
        reminders.forEach((reminder, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'reminder-item';
    
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            listItem.appendChild(deleteButton);
    
            if (reminder.type === 'one-time') {
                listItem.innerHTML += `
                    <div class="reminder-content">
                        <p><strong>${reminder.name}</strong> - ${new Date(reminder.time).toLocaleString('en-GB', { hour12: false })} - Time Remaining: <span id="time-${index}"></span></p>
                    </div>
                `;
                reminderList.appendChild(listItem);
    
                const intervalId = setInterval(() => {
                    const timeRemaining = calculateTimeRemaining(new Date(reminder.time));
    
                    if (timeRemaining.total <= 0) {
                        clearInterval(intervalId);
                        sendNotification(reminder);
                        reminders.splice(index, 1);
                        saveRemindersToFile();
                        listItem.remove();
                    } else {
                        document.getElementById(`time-${index}`).textContent = timeRemaining.display;
                    }
                }, 1000);
            } else {
                listItem.innerHTML += `
                    <div class="reminder-content">
                        <p><strong>${reminder.name}</strong> - ${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)} Reminder</p>
                        <input type="checkbox" id="check-${index}" ${reminder.checked ? 'checked' : ''} /> Mark as Done
                    </div>
                `;
                reminderList.appendChild(listItem);
    
                const checkbox = document.getElementById(`check-${index}`);
                checkbox.addEventListener('change', () => {
                    reminder.checked = checkbox.checked;
                    saveRemindersToFile();
                });
            }
        });
    
        resetCheckboxesAtMidnight();
    }
    
    function displayErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.color = 'red';
        const modalContent = document.querySelector('.modal-content');
        modalContent.appendChild(errorDiv);
    }

    function clearErrorMessage() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    function calculateTimeRemaining(targetTime) {
        const now = new Date();
        const timeDiff = targetTime - now;

        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        return {
            total: timeDiff,
            display: `${days}d ${hours}h ${minutes}m ${seconds}s`
        };
    }

    function resetCheckboxesAtMidnight() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);

        const timeUntilMidnight = midnight - now;

        setTimeout(() => {
            reminders.forEach((reminder) => {
                if (reminder.type !== 'one-time') {
                    reminder.checked = false;
                }
            });
            saveRemindersToFile();
            updateReminders();
            resetCheckboxesAtMidnight();
        }, timeUntilMidnight);
    }

    function sendNotification(reminder) {
        if (Notification.permission === "granted") {
            new Notification('Reminder Alert', {
                body: `${reminder.name} (${reminder.type} Reminder) for ${new Date(reminder.time).toLocaleString('en-GB', { hour12: false })} has ended!`
            });
        }
    }

    function saveRemindersToFile() {
        fs.writeFileSync(remindersFilePath, JSON.stringify(reminders, null, 2));
    }

    reminderList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-button')) {
            const index = Array.from(reminderList.children).indexOf(event.target.parentElement);
            reminders.splice(index, 1);
            saveRemindersToFile();
            updateReminders();
        }
    });
});

