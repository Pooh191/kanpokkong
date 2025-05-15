// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'arlington140568'
};

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('admin-login-form');
const usernameInput = document.getElementById('admin-username');
const passwordInput = document.getElementById('admin-password');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Registration management
const registrationsTable = document.getElementById('admin-registrations-table').getElementsByTagName('tbody')[0];
const refreshRegistrationsBtn = document.getElementById('refresh-registrations-btn');
const exportRegistrationsBtn = document.getElementById('export-registrations-btn');

// Land management
const landDistrictSelect = document.getElementById('land-district-select');
const landSubdistrictSelect = document.getElementById('land-subdistrict-select');
const landPlotSelect = document.getElementById('land-plot-select');
const currentLandStatus = document.getElementById('current-land-status');
const newLandStatus = document.getElementById('new-land-status');
const updateLandStatusBtn = document.getElementById('update-land-status-btn');
const bulkUpdateBtn = document.getElementById('bulk-update-btn');

// Person management
const personsTable = document.getElementById('persons-table').getElementsByTagName('tbody')[0];
const addPersonBtn = document.getElementById('add-person-btn');
const addPersonForm = document.getElementById('add-person-form');
const newPersonName = document.getElementById('new-person-name');
const newPersonDistrict = document.getElementById('new-person-district');
const newPersonProvince = document.getElementById('new-person-province');
const savePersonBtn = document.getElementById('save-person-btn');
const cancelAddPersonBtn = document.getElementById('cancel-add-person-btn');

// System settings
const registrationStatus = document.getElementById('registration-status');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const backupDataBtn = document.getElementById('backup-data-btn');
const restoreDataBtn = document.getElementById('restore-data-btn');

// Logout button
const logoutBtn = document.getElementById('logout-btn');

// URL ของ Google Apps Script Web App
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyLrbeLnjU2BSog5o7tGAYNPRO18JvtKQy2oUZZNHFRURCw4ZmcGYu7t5V9UFuu7Y9W/exec'; // ⚠️ แทนที่ด้วย URL จริงของคุณ

let appData = {
    persons: [],
    subdistricts: {},
    registrations: [],
    landStatus: {}
};

// Initialize the application
function initAdmin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminDashboard();
    } else {
        showLoginSection();
    }
    setupEventListeners();
}

// Show/hide sections
function showLoginSection() {
    loginSection.style.display = 'block';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    loadData();
    populateLandDistrictSelect();
    activateDefaultTab();
}

function activateDefaultTab() {
    const defaultTab = document.querySelector('.tab-btn[data-tab="registrations-tab"]');
    if (defaultTab) switchTab(defaultTab.getAttribute('data-tab'));
}

// Setup event listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            switchTab(this.dataset.tab);
        });
    });

    refreshRegistrationsBtn.addEventListener('click', () => loadData());
    exportRegistrationsBtn.addEventListener('click', exportRegistrations);

    landDistrictSelect.addEventListener('change', function () {
        const district = this.value;
        if (district) {
            landSubdistrictSelect.disabled = false;
            populateLandSubdistrictSelect(district);
        } else {
            resetLandSelection();
        }
    });

    landSubdistrictSelect.addEventListener('change', function () {
        const district = landDistrictSelect.value;
        const subdistrict = this.value;
        if (district && subdistrict) {
            landPlotSelect.disabled = false;
            populateLandPlotSelect(district, subdistrict);
        } else {
            landPlotSelect.disabled = true;
            currentLandStatus.value = '';
        }
    });

    landPlotSelect.addEventListener('change', function () {
        const district = landDistrictSelect.value;
        const subdistrict = landSubdistrictSelect.value;
        const plot = this.value;
        updateCurrentLandStatusDisplay(district, subdistrict, plot);
    });

    updateLandStatusBtn.addEventListener('click', updateLandStatus);
    bulkUpdateBtn.addEventListener('click', bulkUpdateLandStatus);

    addPersonBtn.addEventListener('click', () => addPersonForm.style.display = 'block');
    cancelAddPersonBtn.addEventListener('click', () => {
        addPersonForm.reset();
        addPersonForm.style.display = 'none';
    });
    savePersonBtn.addEventListener('click', saveNewPerson);

    saveSettingsBtn.addEventListener('click', saveSystemSettings);
    backupDataBtn.addEventListener('click', backupData);
    restoreDataBtn.addEventListener('click', restoreData);

    logoutBtn.addEventListener('click', logout);
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminDashboard();
        alert('เข้าสู่ระบบสำเร็จ!');
    } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        passwordInput.focus();
    }
}

// Switch tabs
function switchTab(tabId) {
    tabContents.forEach(content => content.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));

    const selectedContent = document.getElementById(tabId);
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (selectedContent) selectedContent.classList.add('active');
    if (activeBtn) activeBtn.classList.add('active');
}

// Load data from Google Sheets
function loadData() {
    fetch(`${GAS_URL}?action=loadData`)
        .then(res => res.json())
        .then(data => {
            appData = {
                persons: data.persons,
                subdistricts: data.subdistricts,
                registrations: data.registrations,
                landStatus: initializeLandStatus()
            };
            updateLandStatusFromRegistrations();
            refreshRegistrations();
            refreshPersons();
        })
        .catch(err => {
            console.error('โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ:', err);
            alert('ไม่สามารถโหลดข้อมูลได้ในขณะนี้');
        });
}

// Initialize land status
function initializeLandStatus() {
    const status = {};
    for (const district in appData.subdistricts) {
        for (const subdistrict of appData.subdistricts[district]) {
            status[`${district}-${subdistrict}`] = { plots: Array(8).fill('available') };
        }
    }
    return status;
}

// Update land status based on existing registrations
function updateLandStatusFromRegistrations() {
    appData.landStatus = initializeLandStatus(); // Reset
    appData.registrations.forEach(reg => {
        const key = `${reg.district}-${reg.subdistrict}`;
        const plotIndex = reg.plot.charCodeAt(0) - 65;
        if (appData.landStatus[key]) {
            appData.landStatus[key].plots[plotIndex] = 'reserved';
        }
    });
}

// Refresh registrations table
function refreshRegistrations() {
    registrationsTable.innerHTML = '';
    if (!appData.registrations.length) {
        const row = registrationsTable.insertRow();
        row.innerHTML = '<td colspan="8" class="no-data">ไม่มีข้อมูลการจอง</td>';
        return;
    }

    appData.registrations.forEach(reg => {
        const statusText = {
            'reserved': 'ถูกจอง',
            'suspended': 'ระงับ'
        }[reg.status] || 'ว่าง';

        const row = registrationsTable.insertRow();
        row.innerHTML = `
            <td>${reg.id}</td>
            <td>${reg.personName}</td>
            <td>${reg.district}</td>
            <td>${reg.province}</td>
            <td>${reg.subdistrict}</td>
            <td>แปลง ${reg.plot}</td>
            <td>${statusText}</td>
            <td>
                <button class="btn-edit" data-id="${reg.id}">แก้ไข</button>
                <button class="btn-delete" data-id="${reg.id}">ลบ</button>
            </td>
        `;

        row.querySelector('.btn-edit')?.addEventListener('click', () => editRegistration(reg.id));
        row.querySelector('.btn-delete')?.addEventListener('click', () => deleteRegistration(reg.id));
    });
}

// Edit/Delete registration
function editRegistration(regId) {
    const reg = appData.registrations.find(r => r.id === regId);
    if (!reg) return;

    const newStatus = prompt('กรุณาเลือกสถานะใหม่:\n(ว่าง, ถูกจอง, ระงับ)', reg.status);
    if (!newStatus) return;

    let statusValue = 'available';
    if (newStatus.includes('ถูกจอง')) statusValue = 'reserved';
    else if (newStatus.includes('ระงับ')) statusValue = 'suspended';

    reg.status = statusValue;
    const key = `${reg.district}-${reg.subdistrict}`;
    const plotIndex = reg.plot.charCodeAt(0) - 65;
    if (appData.landStatus[key]) {
        appData.landStatus[key].plots[plotIndex] = statusValue;
    }

    saveData();
    refreshRegistrations();
    alert('แก้ไขสถานะเรียบร้อยแล้ว');
}

function deleteRegistration(regId) {
    if (!confirm('คุณแน่ใจที่จะลบการจองนี้หรือไม่?')) return;
    appData.registrations = appData.registrations.filter(r => r.id !== regId);
    saveData();
    refreshRegistrations();
    alert('ลบการจองเรียบร้อยแล้ว');
}

// Land Management functions
function populateLandDistrictSelect() {
    landDistrictSelect.innerHTML = '<option value="">-- เลือกอำเภอ --</option>';
    Object.keys(appData.subdistricts).forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        landDistrictSelect.appendChild(option);
    });
}

function populateLandSubdistrictSelect(district) {
    landSubdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
    if (appData.subdistricts[district]) {
        appData.subdistricts[district].forEach(subdistrict => {
            const option = document.createElement('option');
            option.value = subdistrict;
            option.textContent = subdistrict;
            landSubdistrictSelect.appendChild(option);
        });
    }
}

function populateLandPlotSelect(district, subdistrict) {
    landPlotSelect.innerHTML = '<option value="">-- เลือกแปลง --</option>';
    const key = `${district}-${subdistrict}`;
    if (appData.landStatus[key]) {
        for (let i = 0; i < 8; i++) {
            const plotLetter = String.fromCharCode(65 + i);
            const option = document.createElement('option');
            option.value = plotLetter;
            option.textContent = `แปลง ${plotLetter}`;
            landPlotSelect.appendChild(option);
        }
    }
}

function updateCurrentLandStatusDisplay(district, subdistrict, plot) {
    const key = `${district}-${subdistrict}`;
    const plotIndex = plot.charCodeAt(0) - 65;
    if (appData.landStatus[key]) {
        const status = appData.landStatus[key].plots[plotIndex];
        currentLandStatus.value = {
            'available': 'ว่าง',
            'reserved': 'ถูกจอง',
            'suspended': 'ระงับ'
        }[status] || 'ไม่ทราบสถานะ';
    } else {
        currentLandStatus.value = '';
    }
}

function updateLandStatus() {
    const district = landDistrictSelect.value;
    const subdistrict = landSubdistrictSelect.value;
    const plot = landPlotSelect.value;
    const status = newLandStatus.value;

    if (!district || !subdistrict || !plot || !status) {
        alert('กรุณาเลือกอำเภอ ตำบล แปลง และสถานะ');
        return;
    }

    const key = `${district}-${subdistrict}`;
    const plotIndex = plot.charCodeAt(0) - 65;

    appData.landStatus[key].plots[plotIndex] = status;

    const reg = appData.registrations.find(
        r => r.district === district && r.subdistrict === subdistrict && r.plot === plot
    );
    if (reg) reg.status = status;

    saveData();
    alert('อัปเดตสถานะแปลงที่ดินเรียบร้อย');
}

function bulkUpdateLandStatus() {
    const district = landDistrictSelect.value;
    const subdistrict = landSubdistrictSelect.value;
    const status = newLandStatus.value;

    if (!district || !subdistrict || !status) {
        alert('กรุณาเลือกอำเภอ ตำบล และสถานะ');
        return;
    }

    if (!confirm(`คุณแน่ใจที่จะเปลี่ยนสถานะทั้งหมดใน ${subdistrict} เป็น "${status}"?`)) return;

    const key = `${district}-${subdistrict}`;
    if (!appData.landStatus[key]) {
        appData.landStatus[key] = { plots: Array(8).fill('available') };
    }

    for (let i = 0; i < 8; i++) {
        appData.landStatus[key].plots[i] = status;
    }

    appData.registrations.forEach(reg => {
        if (reg.district === district && reg.subdistrict === subdistrict) {
            reg.status = status;
        }
    });

    saveData();
    alert('อัปเดตสถานะทั้งตำบลเรียบร้อยแล้ว');
}

function resetLandSelection() {
    landSubdistrictSelect.disabled = true;
    landSubdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
    landPlotSelect.disabled = true;
    landPlotSelect.innerHTML = '<option value="">-- เลือกแปลง --</option>';
    currentLandStatus.value = '';
}

// Export / Backup / Restore
function exportRegistrations() {
    const dataStr = JSON.stringify(appData.registrations, null, 2);
    downloadFile(dataStr, 'registrations');
}

function backupData() {
    const dataStr = JSON.stringify(appData, null, 2);
    downloadFile(dataStr, 'backup');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const restored = JSON.parse(event.target.result);
                if (confirm('คุณแน่ใจที่จะกู้คืนข้อมูลนี้หรือไม่?')) {
                    appData = restored;
                    saveData();
                    refreshRegistrations();
                    refreshPersons();
                    alert('กู้คืนข้อมูลสำเร็จ');
                }
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function downloadFile(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Person Management
function refreshPersons() {
    personsTable.innerHTML = '';
    if (!appData.persons.length) {
        const row = personsTable.insertRow();
        row.innerHTML = '<td colspan="5" class="no-data">ไม่มีข้อมูลบุคคล</td>';
        return;
    }

    appData.persons.forEach(person => {
        const row = personsTable.insertRow();
        row.innerHTML = `
            <td>${person.id}</td>
            <td>${person.name}</td>
            <td>${person.district}</td>
            <td>${person.province}</td>
            <td>
                <button class="btn-edit-person" data-id="${person.id}">แก้ไข</button>
                <button class="btn-delete-person" data-id="${person.id}">ลบ</button>
            </td>
        `;
        row.querySelector('.btn-edit-person')?.addEventListener('click', () => editPerson(person.id));
        row.querySelector('.btn-delete-person')?.addEventListener('click', () => deletePerson(person.id));
    });
}

function saveNewPerson() {
    const name = newPersonName.value.trim();
    const district = newPersonDistrict.value.trim();
    const province = newPersonProvince.value.trim();
    if (!name || !district || !province) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const newId = Math.max(...appData.persons.map(p => p.id), 0) + 1;
    appData.persons.push({ id: newId, name, district, province });
    saveData();
    refreshPersons();
    addPersonForm.reset();
    addPersonForm.style.display = 'none';
    alert('เพิ่มบุคคลสำเร็จ');
}

function editPerson(id) {
    const person = appData.persons.find(p => p.id === id);
    if (!person) return;

    const newName = prompt('ชื่อใหม่:', person.name);
    const newDistrict = prompt('อำเภอใหม่:', person.district);
    const newProvince = prompt('จังหวัดใหม่:', person.province);
    if (!newName || !newDistrict || !newProvince) return;

    person.name = newName.trim();
    person.district = newDistrict.trim();
    person.province = newProvince.trim();

    saveData();
    refreshPersons();
    alert('แก้ไขข้อมูลบุคคลสำเร็จ');
}

function deletePerson(id) {
    if (!confirm('คุณแน่ใจที่จะลบบุคคลนี้หรือไม่?')) return;
    if (appData.registrations.some(reg => reg.personId === id)) {
        alert('ไม่สามารถลบบุคคลนี้ได้ เนื่องจากมีการจองที่ดินอยู่');
        return;
    }

    appData.persons = appData.persons.filter(p => p.id !== id);
    saveData();
    refreshPersons();
    alert('ลบบุคคลสำเร็จ');
}

// Save data to Google Sheets via GAS
function saveData() {
    fetch(`${GAS_URL}?action=saveAll`, {
        method: 'POST',
        body: new URLSearchParams({
            data: JSON.stringify(appData)
        })
    }).then(() => {
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    });
}

// Load data again
function reloadData() {
    loadData();
    alert('โหลดข้อมูลใหม่เรียบร้อยแล้ว');
}

// Save system settings
function saveSystemSettings() {
    const settings = {
        registrationStatus: registrationStatus.value
    };
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
}

// Logout
function logout() {
    localStorage.removeItem('adminLoggedIn');
    showLoginSection();
}

// Initialize app
document.addEventListener('DOMContentLoaded', initAdmin);
