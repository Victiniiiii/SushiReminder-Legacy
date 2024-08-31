document.getElementById('createReminderBtn').addEventListener('click', () => {
    document.getElementById('reminderModal').style.display = 'block';
});

function closeModal() {
    document.getElementById('reminderModal').style.display = 'none';
}

function openTab(evt, tabName) {
    const tabContent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = 'none';
    }
    document.getElementById(tabName).style.display = 'block';
}

function saveReminder() {
    const reminderName = document.getElementById('reminderName').value;
    const reminderCategory = document.getElementById('reminderCategory').value;
    const reminderDate = document.getElementById('reminderDate').value;

    const newReminder = {
        name: reminderName,
        category: reminderCategory,
        date: reminderDate,
        remainingTime: window.electron.calculateRemainingTime(reminderDate),
    };

    window.electron.saveReminder(newReminder);

    closeModal();
    // Refresh reminders display (optional)
}

document.getElementById('reminderCategory').addEventListener('change', (e) => {
    const reminderRepeat = document.getElementById('reminderRepeat');
    if (e.target.value === 'repeated') {
        reminderRepeat.disabled = false;
    } else {
        reminderRepeat.disabled = true;
    }
});
