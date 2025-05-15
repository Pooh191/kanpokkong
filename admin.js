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

// Registration management elements
const registrationsTable = document.getElementById('admin-registrations-table').getElementsByTagName('tbody')[0];
const refreshRegistrationsBtn = document.getElementById('refresh-registrations-btn');
const exportRegistrationsBtn = document.getElementById('export-registrations-btn');

// Land management elements
const landDistrictSelect = document.getElementById('land-district-select');
const landSubdistrictSelect = document.getElementById('land-subdistrict-select');
const landPlotSelect = document.getElementById('land-plot-select');
const currentLandStatus = document.getElementById('current-land-status');
const newLandStatus = document.getElementById('new-land-status');
const updateLandStatusBtn = document.getElementById('update-land-status-btn');
const bulkUpdateBtn = document.getElementById('bulk-update-btn');

// Person management elements
const personsTable = document.getElementById('persons-table').getElementsByTagName('tbody')[0];
const addPersonBtn = document.getElementById('add-person-btn');
const addPersonForm = document.getElementById('add-person-form');
const newPersonName = document.getElementById('new-person-name');
const newPersonDistrict = document.getElementById('new-person-district');
const newPersonProvince = document.getElementById('new-person-province');
const savePersonBtn = document.getElementById('save-person-btn');
const cancelAddPersonBtn = document.getElementById('cancel-add-person-btn');

// System settings elements
const registrationStatus = document.getElementById('registration-status');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const backupDataBtn = document.getElementById('backup-data-btn');
const restoreDataBtn = document.getElementById('restore-data-btn');

// Initialize admin app
function initAdmin() {
    console.log('Initializing admin system...');
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        console.log('User already logged in, showing dashboard');
        showAdminDashboard();
    } else {
        console.log('User not logged in, showing login form');
        showLoginSection();
    }
    setupEventListeners();
}

// Show login section
function showLoginSection() {
    loginSection.style.display = 'block';
    adminDashboard.style.display = 'none';
    console.log('Showing login section');
}

// Show admin dashboard
function showAdminDashboard() {
    loginSection.style.display = 'none';
    adminDashboard.style.display = 'block';
    console.log('Showing admin dashboard');
    loadData();
    refreshRegistrations();
    refreshPersons();
    populateLandDistrictSelect();

    // Load system settings
    let settings = {};
    try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
    } catch (e) {
        console.error('Failed to parse system settings:', e);
        settings = {};
    }

    if (settings.registrationStatus) {
        registrationStatus.value = settings.registrationStatus;
    }

    // Activate first tab by default
    const defaultTab = document.getElementById('registrations-tab');
    if (defaultTab) {
        switchTab('registrations-tab');
    } else {
        // หากไม่มี tab เริ่มต้นให้เลือก tab แรกในรายการ
        const firstTabBtn = document.querySelector('.tab-btn');
        if (firstTabBtn) {
            const tabId = firstTabBtn.getAttribute('data-tab');
            switchTab(tabId);
        }
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    console.log('Username entered:', username);
    console.log('Password entered:', password);
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('Login credentials correct');
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminDashboard();
        alert('เข้าสู่ระบบสำเร็จ!');
    } else {
        console.log('Login credentials incorrect');
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Switch tabs
function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    // Hide all tab contents
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    // Deactivate all tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    // Activate selected tab
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    // Find and activate the corresponding button
    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    // Login form
    loginForm.addEventListener('submit', handleLogin);
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    // Registration management
    refreshRegistrationsBtn.addEventListener('click', refreshRegistrations);
    exportRegistrationsBtn.addEventListener('click', exportRegistrations);
    // Land management
    landDistrictSelect.addEventListener('change', function () {
        const district = this.value;
        if (district) {
            landSubdistrictSelect.disabled = false;
            populateLandSubdistrictSelect(district);
        } else {
            landSubdistrictSelect.disabled = true;
            landSubdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
            landPlotSelect.disabled = true;
            landPlotSelect.innerHTML = '<option value="">-- เลือกแปลง --</option>';
            currentLandStatus.value = '';
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
            landPlotSelect.innerHTML = '<option value="">-- เลือกแปลง --</option>';
            currentLandStatus.value = '';
        }
    });
    landPlotSelect.addEventListener('change', function () {
        const district = landDistrictSelect.value;
        const subdistrict = landSubdistrictSelect.value;
        const plot = this.value;
        if (district && subdistrict && plot) {
            const key = `${district}-${subdistrict}`;
            const plotIndex = plot.charCodeAt(0) - 65;
            if (window.appData.landStatus[key]) {
                const status = window.appData.landStatus[key].plots[plotIndex];
                let statusText;
                if (status === 'available') statusText = 'ว่าง';
                else if (status === 'reserved') statusText = 'ถูกจอง';
                else if (status === 'suspended') statusText = 'ระงับ';
                else statusText = 'ไม่ทราบสถานะ';
                currentLandStatus.value = statusText;
            }
        } else {
            currentLandStatus.value = '';
        }
    });
    updateLandStatusBtn.addEventListener('click', function () {
        const district = landDistrictSelect.value;
        const subdistrict = landSubdistrictSelect.value;
        const plot = landPlotSelect.value;
        const status = newLandStatus.value;
        if (!district || !subdistrict || !plot) {
            alert('กรุณาเลือกอำเภอ ตำบล และแปลงที่ดิน');
            return;
        }
        const key = `${district}-${subdistrict}`;
        const plotIndex = plot.charCodeAt(0) - 65;
        if (!window.appData.landStatus[key]) {
            window.appData.landStatus[key] = { plots: Array(8).fill('available') };
        }
        // Update land status
        window.appData.landStatus[key].plots[plotIndex] = status;
        // Update corresponding registration if exists
        const registrationIndex = window.appData.registrations.findIndex(reg =>
            reg.district === district &&
            reg.subdistrict === subdistrict &&
            reg.plot === plot
        );
        if (registrationIndex !== -1) {
            window.appData.registrations[registrationIndex].status = status;
        }
        saveData();
        refreshRegistrations();
        alert('อัพเดทสถานะที่ดินเรียบร้อยแล้ว');
        // Update current status display
        const statusText = {
            'available': 'ว่าง',
            'reserved': 'ถูกจอง',
            'suspended': 'ระงับ'
        }[status] || 'ไม่ทราบสถานะ';
        currentLandStatus.value = statusText;
    });
    bulkUpdateBtn.addEventListener('click', function () {
        const district = landDistrictSelect.value;
        const subdistrict = landSubdistrictSelect.value;
        const status = newLandStatus.value;
        if (!district || !subdistrict) {
            alert('กรุณาเลือกอำเภอและตำบล');
            return;
        }
        if (!confirm(`คุณแน่ใจที่จะเปลี่ยนสถานะทั้งหมดในตำบล ${subdistrict} เป็น "${status === 'available' ? 'ว่าง' : status === 'reserved' ? 'ถูกจอง' : 'ระงับ'}"?`)) {
            return;
        }
        const key = `${district}-${subdistrict}`;
        if (!window.appData.landStatus[key]) {
            window.appData.landStatus[key] = { plots: Array(8).fill('available') };
        }
        // Update all plots in the subdistrict
        for (let i = 0; i < 8; i++) {
            window.appData.landStatus[key].plots[i] = status;
        }
        // Update corresponding registrations
        window.appData.registrations.forEach(reg => {
            if (reg.district === district && reg.subdistrict === subdistrict) {
                reg.status = status;
            }
        });
        saveData();
        refreshRegistrations();
        alert('อัพเดทสถานะที่ดินทั้งหมดในตำบลนี้เรียบร้อยแล้ว');
    });
    // Person management
    addPersonBtn.addEventListener('click', function () {
        addPersonForm.style.display = 'block';
        newPersonName.focus();
    });
    cancelAddPersonBtn.addEventListener('click', function () {
        addPersonForm.style.display = 'none';
        addPersonForm.reset();
    });
    savePersonBtn.addEventListener('click', function () {
        const name = newPersonName.value.trim();
        const district = newPersonDistrict.value.trim();
        const province = newPersonProvince.value.trim();
        if (!name || !district || !province) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        // Generate new ID
        const newId = window.appData.persons.length > 0 ?
            Math.max(...window.appData.persons.map(p => p.id)) + 1 : 1;
        // Add new person
        const newPerson = {
            id: newId,
            name,
            district,
            province
        };
        window.appData.persons.push(newPerson);
        saveData();
        refreshPersons();
        // Reset and hide form
        addPersonForm.style.display = 'none';
        addPersonForm.reset();
        alert('เพิ่มบุคคลใหม่เรียบร้อยแล้ว');
    });
    // System settings
    saveSettingsBtn.addEventListener('click', function () {
        const settings = {
            registrationStatus: registrationStatus.value
        };
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        alert('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
    });
    backupDataBtn.addEventListener('click', function () {
        const dataStr = JSON.stringify(window.appData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `land-registration-backup-${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });
    restoreDataBtn.addEventListener('click', function () {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!confirm('คุณแน่ใจที่จะกู้คืนข้อมูลจากไฟล์นี้หรือไม่? ข้อมูลปัจจุบันจะถูกแทนที่')) {
                        return;
                    }
                    window.appData = data;
                    saveData();
                    refreshRegistrations();
                    refreshPersons();
                    populateLandDistrictSelect();
                    alert('กู้คืนข้อมูลเรียบร้อยแล้ว');
                } catch (error) {
                    alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    });
}

// Load data from localStorage
function loadData() {
    console.log('Loading data from localStorage');
    const savedData = localStorage.getItem('landRegistrationData');
    if (savedData) {
        window.appData = JSON.parse(savedData);
        console.log('Data loaded successfully');
    } else {
        // Initialize with empty data if not found
        window.appData = {
            persons: [],
            subdistricts: {},
            registrations: [],
            landStatus: {}
        };
        console.log('No saved data found, initialized empty data');
    }
}

// Save data to localStorage
function saveData() {
    console.log('Saving data to localStorage');
    localStorage.setItem('landRegistrationData', JSON.stringify(window.appData));
}

// Refresh registrations table
function refreshRegistrations() {
    console.log('Refreshing registrations table');
    registrationsTable.innerHTML = '';
    if (!window.appData.registrations || window.appData.registrations.length === 0) {
        const row = registrationsTable.insertRow();
        row.innerHTML = '<td colspan="8" class="no-data">ไม่มีข้อมูลการจองที่ดิน</td>';
        return;
    }
    window.appData.registrations.forEach(reg => {
        const row = registrationsTable.insertRow();
        const statusText = {
            'reserved': 'ถูกจอง',
            'suspended': 'ระงับ'
        }[reg.status] || 'ว่าง';
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
    });
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function () {
            const regId = parseInt(this.getAttribute('data-id'));
            editRegistration(regId);
        });
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const regId = parseInt(this.getAttribute('data-id'));
            deleteRegistration(regId);
        });
    });
}

// Edit registration
function editRegistration(regId) {
    console.log('Editing registration:', regId);
    const registration = window.appData.registrations.find(reg => reg.id === regId);
    if (!registration) return;
    const newStatus = prompt(`แก้ไขสถานะการจองสำหรับ ${registration.personName} (แปลง ${registration.plot}):
กรอก 'ว่าง', 'ถูกจอง' หรือ 'ระงับ'`, 
        registration.status === 'reserved' ? 'ถูกจอง' : 
        registration.status === 'suspended' ? 'ระงับ' : 'ว่าง');
    if (newStatus === null) return;
    let statusValue;
    if (newStatus === 'ว่าง') statusValue = 'available';
    else if (newStatus === 'ถูกจอง') statusValue = 'reserved';
    else if (newStatus === 'ระงับ') statusValue = 'suspended';
    else {
        alert('กรุณากรอกสถานะให้ถูกต้อง');
        return;
    }
    // Update registration status
    registration.status = statusValue;
    // Update land status
    const key = `${registration.district}-${registration.subdistrict}`;
    const plotIndex = registration.plot.charCodeAt(0) - 65;
    if (window.appData.landStatus[key]) {
        window.appData.landStatus[key].plots[plotIndex] = statusValue;
    }
    saveData();
    refreshRegistrations();
    alert('แก้ไขสถานะเรียบร้อยแล้ว');
}

// Delete registration
function deleteRegistration(regId) {
    console.log('Deleting registration:', regId);
    if (!confirm('คุณแน่ใจที่จะลบการจองนี้หรือไม่?')) return;
    const registration = window.appData.registrations.find(reg => reg.id === regId);
    if (!registration) return;
    // Update land status to available
    const key = `${registration.district}-${registration.subdistrict}`;
    const plotIndex = registration.plot.charCodeAt(0) - 65;
    if (window.appData.landStatus[key]) {
        window.appData.landStatus[key].plots[plotIndex] = 'available';
    }
    // Remove from registrations
    window.appData.registrations = window.appData.registrations.filter(reg => reg.id !== regId);
    saveData();
    refreshRegistrations();
    alert('ลบการจองเรียบร้อยแล้ว');
}

// Export registrations data
function exportRegistrations() {
    console.log('Exporting registrations data');
    const dataStr = JSON.stringify(window.appData.registrations, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `land-registrations-${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Populate district select for land management
function populateLandDistrictSelect() {
    console.log('Populating district select');
    landDistrictSelect.innerHTML = '<option value="">-- เลือกอำเภอ --</option>';
    const districts = Object.keys(window.appData.subdistricts);
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        landDistrictSelect.appendChild(option);
    });
}

// Populate subdistrict select for land management
function populateLandSubdistrictSelect(district) {
    console.log('Populating subdistrict select for:', district);
    landSubdistrictSelect.innerHTML = '<option value="">-- เลือกตำบล --</option>';
    if (window.appData.subdistricts[district]) {
        window.appData.subdistricts[district].forEach(subdistrict => {
            const option = document.createElement('option');
            option.value = subdistrict;
            option.textContent = subdistrict;
            landSubdistrictSelect.appendChild(option);
        });
    }
}

// Populate plot select for land management
function populateLandPlotSelect(district, subdistrict) {
    console.log('Populating plot select for:', district, subdistrict);
    landPlotSelect.innerHTML = '<option value="">-- เลือกแปลง --</option>';
    const key = `${district}-${subdistrict}`;
    if (window.appData.landStatus[key]) {
        for (let i = 0; i < 8; i++) {
            const plotLetter = String.fromCharCode(65 + i);
            const option = document.createElement('option');
            option.value = plotLetter;
            option.textContent = `แปลง ${plotLetter}`;
            landPlotSelect.appendChild(option);
        }
    }
}

// Refresh persons table
function refreshPersons() {
    console.log('Refreshing persons table');
    personsTable.innerHTML = '';
    if (!window.appData.persons || window.appData.persons.length === 0) {
        const row = personsTable.insertRow();
        row.innerHTML = '<td colspan="5" class="no-data">ไม่มีข้อมูลบุคคล</td>';
        return;
    }
    window.appData.persons.forEach(person => {
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
    });
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.btn-edit-person').forEach(btn => {
        btn.addEventListener('click', function () {
            const personId = parseInt(this.getAttribute('data-id'));
            editPerson(personId);
        });
    });
    document.querySelectorAll('.btn-delete-person').forEach(btn => {
        btn.addEventListener('click', function () {
            const personId = parseInt(this.getAttribute('data-id'));
            deletePerson(personId);
        });
    });
}

// Edit person
function editPerson(personId) {
    console.log('Editing person:', personId);
    const person = window.appData.persons.find(p => p.id === personId);
    if (!person) return;
    const newName = prompt('แก้ไขชื่อ-นามสกุล:', person.name);
    if (newName === null) return;
    const newDistrict = prompt('แก้ไขอำเภอ:', person.district);
    if (newDistrict === null) return;
    const newProvince = prompt('แก้ไขจังหวัด:', person.province);
    if (newProvince === null) return;
    person.name = newName.trim();
    person.district = newDistrict.trim();
    person.province = newProvince.trim();
    saveData();
    refreshPersons();
    alert('แก้ไขข้อมูลบุคคลเรียบร้อยแล้ว');
}

// Delete person
function deletePerson(personId) {
    console.log('Deleting person:', personId);
    if (!confirm('คุณแน่ใจที่จะลบบุคคลนี้หรือไม่?')) return;
    // Check if person has any registrations
    const hasRegistrations = window.appData.registrations.some(reg => reg.personId === personId);
    if (hasRegistrations) {
        alert('ไม่สามารถลบบุคคลนี้ได้ เนื่องจากมีข้อมูลการจองที่ดินเกี่ยวข้อง');
        return;
    }
    window.appData.persons = window.appData.persons.filter(p => p.id !== personId);
    saveData();
    refreshPersons();
    alert('ลบบุคคลเรียบร้อยแล้ว');
}

// Logout functionality
function logout() {
    console.log('Logging out');
    localStorage.removeItem('adminLoggedIn');
    showLoginSection();
}

// Initialize the admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    initAdmin();
});

// Debug: Log when script is loaded
console.log('Admin script loaded successfully');

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
        logout();
    });
}