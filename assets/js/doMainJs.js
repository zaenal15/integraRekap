const documentSection = document.getElementsByTagName('html')
const bodySection = document.querySelector('body')
const mainSection = document.querySelector('main')
const doModal = document.querySelector('#doModal')
const mainSlideBar = document.querySelector('#mainSlideBar')
const mainSidebar = document.querySelector('#mainSidebar')
const mainHeader = document.querySelector('#mainHeader')

let userInfo = {}
let menuLists = {}
let idleInterval = ''

methodLists = {
  'insert': 'POST',
  'add': 'POST',
  'update': 'PUT',
  'delete': 'DELETE',
}

// GENERAL AND USER SETTINGS -->
let
  settingLists,
  broadcastTextInfo,
  runningTextDashboard,
  timerSession,
  countdownSession

let userSettingLists, selectedSlideshow, selectedTheme, selectedTypeChart, sidebarMode

let currentUserMenuLevel,
  mainMenus,
  subMenus,
  titleMainMenu,
  titleHeader,
  slidebarButton,
  themeButton,
  buildingFilterHeader,
  slideshowControlPanel


const urlToAssets = AppConfig.urlToAssets;
const urlToTemplate = AppConfig.urlToTemplate;
const urlToViews = AppConfig.urlToViews;

const monthNamesFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  dayNamesFullStartMon = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  dayNamesStartMon = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

let idleTime = 0;
let countDownLogoutInterval = ''

// INTERVAL LOAD LOGS DASHBOARD --> 
let randomizePeopleCounterInterval = ''
let randomizeLogDashboardInterval = ''
let intervalRealtime = ''

todayDate()

// GET CURRENT COOKIE
let currentCookie = document.cookie.split('cookie-name=')[1]
let intervalCheckCookie = undefined
window.addEventListener('blur', function () {
  intervalCheckCookie = this.setInterval(() => {
    if (document.cookie.split('cookie-name=')[1] !== currentCookie) {
      window.location.href = "/"
    }
  }, 1000)
})
window.addEventListener('focus', function () {
  this.clearInterval(intervalCheckCookie)
})

// ADD DEFAULT MODALS -->
const defaultModals = ["#modal-keep-login", "#modal-verify-password", '#modal-change-password', '#modal-change-picture']
function setDefaultModal() {
  fillModalContent(defaultModals)
  $('#change-password-old-field').on('change', function () {
    checkPass(this, this.value, 'individual')
  })
}
modalKeepLogin = document.querySelector(defaultModals[0])
modalVerifyPass = document.querySelector(defaultModals[1])
modalChangePass = document.querySelector(defaultModals[2])
modalChangePhoto = document.querySelector(defaultModals[3])

function todayDate() {
  yesterday = new Date()
  tomorrow = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  tomorrow.setDate(tomorrow.getDate() + 1)

  today = new Date()
  todayYMD = today.getFullYear() + '-' + padZero(today.getMonth() + 1, 2) + '-' + padZero(today.getDate(), 2)
  todayYMDHIS = todayYMD + ' ' + padZero(today.getHours(), 2) + ':' + padZero(today.getMinutes(), 2) + ':' + padZero(today.getSeconds(), 2)
  todayTime = padZero(today.getHours(), 2) + ':' + padZero(today.getMinutes(), 2) + ':' + padZero(today.getSeconds(), 2)
  todayHour = padZero(today.getHours(), 2) + ':' + padZero(today.getMinutes(), 2)
  todayDateText = dayNamesFull[today.getDay()] + ', ' + padZero(today.getDate(), 2) + ' ' + monthNamesFull[today.getMonth()] + ' ' + today.getFullYear()
  todayDateTimeText = todayDateText + ' ' + todayTime
  todayDateHourText = todayDateText + ' ' + todayHour
}

function selectedDateConvert(date) {
  selectedDate = new Date(date)
  selectedDateYMD = selectedDate.getFullYear() + '-' + padZero(selectedDate.getMonth() + 1, 2) + '-' + padZero(selectedDate.getDate(), 2)
  selectedDateTime = padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2) + ':' + padZero(selectedDate.getSeconds(), 2)
  selectedDateYMDHIS = selectedDateYMD + ' ' + selectedDateTime
  selectedDateText = dayNamesFull[selectedDate.getDay()] + ', ' + padZero(selectedDate.getDate(), 2) + ' ' + monthNamesFull[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear()
  selectedDateTimeText = selectedDateText + ' ' + selectedDateTime
}

function returnSelectedDateConvert(date, format) {
  if (date == "0000-00-00") return "-"
  selectedDate = new Date(date)
  if (format == "ym") return selectedDate.getFullYear() + '-' + padZero(selectedDate.getMonth() + 1, 2)
  if (format == "ymd") return selectedDate.getFullYear() + '-' + padZero(selectedDate.getMonth() + 1, 2) + '-' + padZero(selectedDate.getDate(), 2)
  if (format == "time") return padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2) + ':' + padZero(selectedDate.getSeconds(), 2)
  if (format == "hi") return padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2)
  if (format == "ymdhis") return selectedDate.getFullYear() + '-' + padZero(selectedDate.getMonth() + 1, 2) + '-' + padZero(selectedDate.getDate(), 2) + ' ' + padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2) + ':' + padZero(selectedDate.getSeconds(), 2)
  if (format == "ymText") return monthNamesFull[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear()
  if (format == "ymdText") return dayNamesFull[selectedDate.getDay()] + ', ' + padZero(selectedDate.getDate(), 2) + ' ' + monthNamesFull[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear()
  if (format == "ymdTextShort") return dayNames[selectedDate.getDay()] + ', ' + padZero(selectedDate.getDate(), 2) + ' ' + monthNames[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear()
  if (format == "ymdhisText") return dayNamesFull[selectedDate.getDay()] + ', ' + padZero(selectedDate.getDate(), 2) + ' ' + monthNamesFull[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear() + ' ' + padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2) + ':' + padZero(selectedDate.getSeconds(), 2)
  if (format == "ymdhisTextShort") return dayNames[selectedDate.getDay()] + ', ' + padZero(selectedDate.getDate(), 2) + ' ' + monthNames[selectedDate.getMonth()] + ' ' + selectedDate.getFullYear() + ' ' + padZero(selectedDate.getHours(), 2) + ':' + padZero(selectedDate.getMinutes(), 2) + ':' + padZero(selectedDate.getSeconds(), 2)
  if (format == "ymdSlash") return selectedDate.getFullYear() + '/' + padZero(selectedDate.getMonth() + 1, 2) + '/' + padZero(selectedDate.getDate(), 2);
}

function getNextMonday(date) {
  const dateCopy = new Date(date.getTime())
  const nextMonday = new Date(
    dateCopy.setDate(
      dateCopy.getDate() + ((7 - dateCopy.getDay() + 1) % 7 || 7),
    ),
  )

  return nextMonday
}

// CHECK AM PM ON HOUR TIME DATE -->
function formatAMPM(date) {
  let hours = date.getHours()
  let minutes = date.getMinutes()
  let ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12 // IF HOUR 0, CONVERT IT TO 12
  minutes = minutes < 10 ? '0' + minutes : minutes
  var ampmTime = hours + '' + ampm
  return ampmTime
}

// CHECK FILTER DATE BETWEEN START AND END DATE -->
function checkStartEndDate(className) {
  startDateVal = document.querySelector(`.${className}[data-field="start"]`).value
  endDateVal = document.querySelector(`.${className}[data-field="end"]`).value
  correctDate = true
  if (startDateVal && endDateVal && (new Date(startDateVal) > new Date(endDateVal))) {
    Swal.fire(
      'Hold on!',
      'End date cannot be less then start date',
      'info',
    )
    document.querySelector(`.${className}[data-field="start"]`).value = endDateVal
    correctDate = false
  }
  return correctDate
}

// GET TIMES BASED ON DATE START AND END -->
function convertTimeToDate(timeStart, timeEnd, get) {
  let dateStart = new Date(timeStart)
  let dateEnd = new Date(timeEnd)
  let dateDiff = dateEnd - dateStart
  let dateDiffSeconds = (dateEnd.getTime() - dateStart.getTime()) / 1000
  let dateDiffMinutes = dateDiff / 60000
  let dateDiffHours = dateDiffMinutes / 60
  let dateDiffDays = dateDiffHours / 24
  let dateDiffWeeks = dateDiffDays / 7
  let dateDiffMonths = dateDiffWeeks / 4.3
  let dateDiffYears = dateDiffMonths / 12
  let dateDiffDecades = dateDiffYears / 10

  if (get == "hours") return dateDiffHours
  if (get == "seconds") return dateDiffSeconds
  if (get == "minutes") return dateDiffMinutes
  if (get == "days") return dateDiffDays
  if (get == "weeks") return dateDiffWeeks
  if (get == "months") return dateDiffMonths
  if (get == "years") return dateDiffYears
  if (get == "decades") return dateDiffDecades
}

// CONVERT SECOND TO HOUR, MINUTES AND SECONDS FORMAT -->
function secondsToTime(second, timeFormat) {
  h = Math.floor(second / 3600)
  m = Math.floor(second % 3600 / 60)
  s = Math.floor(second % 60)

  if (timeFormat) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  if (h >= 1) return h + " hour(s)"
  if (m >= 1) return m + " minute(s)"
  else return s + " second(s)"
}

// CONVERT MINUTES TO SECONDS -->
function minutesToSeconds(minutes) { return parseInt(minutes * 60) }

// CONVERT VALUE FORMAT RUPIAH -->
function thousandFormat(number, prefix, symbol) {
  number = number.toString().replace('.', ',')
  var number_string = number.replace(/[^,\d]/g, "").toString(),
    split = number_string.split(","),
    leftover = split[0].length % 3,
    numberSet = split[0].substr(0, leftover),
    thousand = split[0].substr(leftover).match(/\d{3}/gi);

  if (thousand) {
    separator = leftover ? "." : "";
    numberSet += separator + thousand.join(".");
  }

  if (symbol == '' || !symbol) symbol = "Rp."
  numberSet = split[1] != undefined ? numberSet + "," + split[1] : numberSet;
  return prefix == undefined ? numberSet : numberSet ? symbol + " " + numberSet : "";
}

// TRIGGER NOT IDLE, THERE ARE MOUSE MOVEMENT OR KEYPRESS -->
$(document).mousemove(function (e) { idleTime = 0 })
$(document).keypress(function (e) { idleTime = 0 })

// FUNCTION AUTO LOGOUT AND POP UP MODAL COUNTDOWN LOGOUT IF HAS BEEN 30 MINUTES --> 
function autoLogout() {
  idleTime = idleTime + 1
  console.log(idleTime)
  if (idleTime > 10) { //INTERVAL AUTO LOG BY DIVIDED VALUE TIMER SESSION BY 10 --> 
    openModal(defaultModals[0])
    countDownLogoutInterval = setInterval(() => {
      countdownSession--
      document.querySelector('#timer-keep-login b').innerHTML = countdownSession
      if (countdownSession == 0) window.location = '/logout?isTimeout=yes'
    }, 1000)
  }
}

// FUNCTION TO KEEP LOGIN AND RESET ALL THE COUNTDOWN -->
function keepLogin() {
  clearInterval(countDownLogoutInterval)
  cdLogoutTimer = 10
  idleTime = 0
  closeModal()
}

// FUNCTION TO EXPAND SIDEBAR -->
function toggleSidebar(el, value) {
  mainSection.classList.remove('fixed', 'expand')
  mainSidebar.classList.remove('expand')
  if (value == "expand") {
    mainSection.classList.add('expand')
    el.innerHTML = '<i class="bx bxs-book-content centerized-sidebar"></i><span class="expanded-sidebar"">Fixed</span>'
    el.setAttribute("value", "fixed")
  } else if (value == "fixed") {
    mainSection.classList.add('fixed')
    mainSidebar.classList.add('expand')
    el.innerHTML = '<i class="fas fa-angle-double-left centerized-sidebar"></i><span class="expanded-sidebar"> Shrink</span>'
    el.setAttribute("value", "shrink")
  } else if (value == "shrink") {
    el.setAttribute("value", "expand")
    el.innerHTML = '<i class="fas fa-angle-double-right centerized-sidebar"></i><span class="expanded-sidebar"> Expand</span>'
  }
}

// LOAD ALL TEMPLATE -->
window.onload = function () {
  loadSidebar()
  loadLoader()
}

// LOAD LOADER SECTIOn -->
function loadLoader() {
  fetch(urlToTemplate + "/doLoader.html")
    .then(response => response.text())
    .then(text => document.getElementById('doLoader').innerHTML = text)
}

// LOAD SLIDEBAR SECTION -->
function loadSlidebar() {
  fetch(urlToTemplate + "/mainSlideBar.html")
    .then(response => response.text())
    .then(text => document.getElementById('mainSlideBar').innerHTML = text)
    .then((text) => {
      const logActivities = setInterval(loadLogActivities, 60000) // 10 secs
      loadLogActivities()

      // LOAD GENERAL SETTINGS -->
      loadData('loadSettings').done(function (newData) {
        settingLists = newData
        timerSession = settingLists[0].timer_session
        countdownSession = settingLists[0].countdown_session
        runningTextDashboard = settingLists[0].running_text
        document.querySelector('#timer-session').value = timerSession
        document.querySelector('#countdown-session').value = countdownSession
        document.querySelector('#broadcast-section').innerHTML = `<i class="fas fa-bullhorn"></i>    ${runningTextDashboard}`

        // SET IDLE INTERVAL -->
        idleInterval = setInterval(autoLogout, ((minutesToSeconds(timerSession) * 1000) / 10)) // CONVERT TO MILISECOND AND DIVIDED BY 10 FOR COUNTDOWN TIMER -->
      }).then((text) => {
        // REMOVE GENERAL SETTING FOR ALL USERS BESIDE ADMIN -->
        if (userInfo['Group_position'] != "EP00") {
          document.querySelector('#general-settings-section').remove()
        }
      })

      // LOAD USER SETTINGS -->
      loadData('loadUserSettings', { username: userInfo.Username, id: userInfo.Id }).done(function (newData) {
        userSettingLists = newData
        selectedSlideshow = userSettingLists[0].selected_slideshow
        selectedTheme = userSettingLists[0].selected_theme
        sidebarMode = userSettingLists[0].selected_sidebar
        document.querySelector('.opt-slideshow-setting[value="' + selectedSlideshow + '"]').classList.add('active')
        document.querySelector('.opt-theme-setting[value="' + selectedTheme + '"]').classList.add('active')
        document.querySelector('.opt-sidebar-setting[value="' + sidebarMode + '"]').classList.add('active')

        // SET TOGGLE SIDEBAR -->
        toggleSidebar(document.querySelector('#toggle-sidebar'), sidebarMode)
        mainSidebar.onmouseenter = function (e) { if (mainSection.classList.contains('expand')) mainSidebar.classList.add('expand') }
        mainSidebar.onmouseleave = function (e) { if (mainSection.classList.contains('expand')) mainSidebar.classList.remove('expand') }

        // SLIDEBAR PHOTO SECTION -->
        document.querySelector('#slidebar-user-info-img').setAttribute('src', `../../assets/images/employee_pictures/${userInfo['Username']}.jpg`)
        document.querySelector('#slidebar-user-info-img').addEventListener('error', function handleError() {
          this.setAttribute('src', `../../assets/svgs/user-male.svg`)
        })
      })
    })
}

// LOAD SIDEBAR SECTION -->
function loadSidebar() {
  fetch(urlToTemplate + "/mainSidebar.html")
    .then(response => response.text())
    .then(text => document.getElementById('mainSidebar').innerHTML = text)
    .then((text) => {
      mainMenus = document.querySelector('#nav-main-menu')
      userInfo = {
        Id: $('#user-Id').val(),
        Name: $('#user-Name').val(),
        Username: $('#user-Username').val(),
        Email: $('#user-Email').val(),
        Group_position: $('#user-Group_position').val(),
        Project_company: $('#user-Project_company').val(),
        Position_name: $('#user-Position_name').val(),
        Company_id: $('#user-Company_id').val(),
        Company_alias: $('#user-Company_alias').val(),
        Company_name: $('#user-Company_name').val(),
        Project_alias: $('#user-Project_alias').val(),
        Project_name: $('#user-Project_name').val(),
        Dashboard_set: $('#user-Dashboard_set').val(),
      }
      // document.querySelector('#user-info').remove()
      // mainHeader.querySelector('#header-user-info-name').innerHTML = "Hi, " + userInfo.Name.split(" ")[0]
      // mainSidebar.querySelector('#copyright-year').innerHTML = today.getFullYear()
      // SIDEBAR PHOTO SECTION -->
      // document.querySelector('#header-user-info-img').setAttribute('src', `../../assets/images/employee_pictures/${userInfo['Username']}.jpg`)
      // document.querySelector('#header-user-info-img').addEventListener('error', function handleError() {
      //   this.setAttribute('src', `../../assets/svgs/user-male.svg`)
      // })
      loadSlidebar()
    }).then((text) => {
      createMenu()
    }).then((text) => {
      loadHeader()
    })
}

// LOAD HEADER SECTION -->
function loadHeader() {
  fetch(urlToTemplate + "/mainHeader.html")
    .then(response => response.text())
    .then(text => document.getElementById('mainHeader').innerHTML = text)
    .then(() => {
      mainHeader.querySelector('#header-user-info-name').innerHTML = userInfo.Name.split(" ")[0]
      buildingFilterHeader = document.querySelector('#building-opt-dashboard')
      setDefaultModal()
      loadFloating()
      titleHeader = document.querySelector('#title-content-header')
      themeButton = document.querySelector('#change-theme-button')
      mainSlideBar.querySelector('#slidebar-user-info-name').innerHTML = "Hi, " + userInfo.Name.split(" ")[0]
    })
}

// FUNCTION TO OPEN VERIFY PASSWORD AND SET VALUE TO IT -->
function openVerifyPassword(el, value) {
  showSlidebar()
  openModal(defaultModals[1])
  document.querySelector('#verify-password').value = value
  document.querySelector('#set-user-password').value = ''
  if (value == "change-password-default") {
    document.querySelector('#modal-verify-password-info').innerHTML = `Verify your password before change <b> default password </b> for all users.`
  }
}

// LOAD FLOATING SECTION -->WW
function loadFloating() {
  fetch(urlToTemplate + "/doFloating.html")
    .then(response => response.text())
    .then(text => document.getElementById('doFloating').innerHTML = text)
}

// FUNCTION LOGOUT -->
function goLogout() {
  Swal.fire({
    title: "Hold on!",
    text: "Are you sure to logout?",
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, log out!',
    confirmButtonAriaLabel: 'Log out!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      window.location = '/logout';
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire(
        'Cancelled',
        "Cancel to logout.",
        'info'
      )
    }
  })
}

// FUNCTION TO REMOVE ALL CLASS ACTIVE AND SET ACTIVE ON SELECTED CLASS -->
function setAndremoveClassActive(el, className, parent, setParent, justRemove, classsName) {
  if (!classsName) classsName = 'active'
  elClassLists = el.closest(parent).querySelectorAll(className)
  if (setParent) elClassLists = el.closest(parent).parentElement.querySelectorAll(parent)
  elClassLists.forEach((elClass) => { elClass.classList.remove(classsName) })
  if (justRemove) return false
  if (!setParent) el.classList.add(classsName)
  else el.closest(parent).classList.add(classsName)
}

// CHANGE THEME -->
// function changeTheme(value) {
//   // Swal.fire({
//   //   title: 'Sorry!',
//   //   text: 'Change to dark / light mode are still in development.',
//   //   imageUrl: '/assets/svgs/dark-mode1.svg',
//   //   imageWidth: '400px',
//   //   imageAlt: 'Custom image',
//   // })
//   // return 
//   themeButton.innerHTML = "<i class='fas fa-moon'>"
//   closeModal()
//   bodySection.classList.toggle("white-theme")
//   if (bodySection.classList.contains("white-theme")) {
//     themeButton.innerHTML = `<i class="fas fa-sun">`
//   }
//   changeChartTheme()
// }

// SHOW CONTENT -->
function loadContent(el, value, menu, file) {
  closeModal();
  if (!checkPrivileged('view', menu)) return false;

  const menuLink = menu;
  const fileContentLoc = `${AppConfig.urlToViews}/${menuLink}/${menuLink}`;
  const htmlPath = `${fileContentLoc}.html`;
  const cssPath = `${fileContentLoc}.css`;
  const jsPath = AppConfig.isDev
    ? `${fileContentLoc}.js`
    : `${window.location.origin}/obfuscated_views/${menuLink}/${menuLink}.js`;

  let checkMenu = true;

  fetch(htmlPath)
    .then(response => response.text())
    .then(text => {
      if (text.includes('not found') || text.includes('404')) {
        Swal.fire('Sorry.', 'This menu is still under development.', 'info');
        checkMenu = false;
      } else {
        document.getElementById('mainContent').innerHTML = text;
      }
    })
    .then(() => {
      if (!checkMenu) return;

      if (file) {
        menuSelected = el;
        document.querySelectorAll('.wrap-sub-menu').forEach(wrap => wrap.classList.remove('open'));

        if (el.classList.contains('sub-menu')) {
          const parentCode = el.getAttribute('data-parent');
          menuSelected = document.querySelector(`#menu-${parentCode}`);
          const wrap = document.querySelector(`#wrap-sub-menu-${parentCode}`);
          setAndremoveClassActive(wrap, '.wrap-sub-menu', '#nav-main-menu', false, false, 'open');
          if (!mainSidebar.classList.contains('expand')) {
            setAndremoveClassActive(wrap, '.wrap-sub-menu', '#nav-main-menu', false, true, 'open');
          }
        }

        setAndremoveClassActive(el, '.sub-menu', '#nav-main-menu', false);
        setAndremoveClassActive(menuSelected, '.main-menu', '#nav-main-menu', false);
        setAndremoveClassActive(menuSelected, '.main-menu', '#nav-main-menu', false, false, 'open');
        if (!mainSidebar.classList.contains('expand')) {
          setAndremoveClassActive(menuSelected, '.main-menu', '#nav-main-menu', false, true, 'open');
        }

        mainSection.classList.remove("openSubMenu");
      } else {
        setAndremoveClassActive(el, '.sub-menu', '.wrap-sub-menu', false);
      }

      // CLEAR running intervals except for dashboard
      if (menu !== "dashboard") {
        clearInterval(randomizePeopleCounterInterval);
        clearInterval(randomizeLogDashboardInterval);
        clearInterval(intervalRealtime);
      }

      $('.stylesheet-menu').remove();
      $('.script-menu').remove();

      openLoader();

      mainHeader.className = '';
      mainHeader.classList.add(`header-${menu}`);
      document.querySelector('.content-wrap').id = `content-${menu}`;
      addStylesheet(`stylesheet-${menu}`, cssPath, "menu");

      // Add script with cache busting to force reload
      addScripts(`script-${menu}`, `${jsPath}?v=${Date.now()}`, "menu");

      titleHeader.innerHTML = el.getAttribute('title-main-menu');
    })
    .then(() => {
      setTimeout(() => closeLoader(), 300);
      if (document.getElementById('mainSidebar').classList.contains('active')) {
        sidebarMobileMenu();
      }
    })
    .catch(error => {
      console.error(error);
      Swal.fire('Sorry.', 'This menu is still under development or missing.', 'info');
      closeLoader();
    });
}



// APPEND MENU LISTS INTO SIDEBAR -->
function createMenu() {
  loadData('loadUserMenu', { userGroup: userInfo["Group_position"] }).done(function (newData) {
    currentUserMenuLevel = newData;
    $.ajax({
      url: "getMenus",
      type: "GET",
      dataType: "json",
      success: function (data) {
        let filteredMenu = data.filter(x => x.parent == 0)
        $.each(filteredMenu, function (i, y) {
          allowed = "not-allowed"
          if (y.code == "settings") return
          if (currentUserMenuLevel[y.code].View == '1') allowed = "allowed"
          else return

          if (y.type == "folder") onclickNav = 'onclick="openSubMenu(this, \'\', \'' + y.code + '\')"'
          else onclickNav = 'onclick="loadContent(this, \'\', \'' + y.code + '\', true)"'
          $('#mainSidebar').find('#nav-main-menu')
            .append(`<button title-main-menu="${y.name}" value="show" ${onclickNav} class="${allowed} main-menu ${y.type} centerized-sidebar" id="menu-${y.code}"></button>`)
            .find(`#menu-${y.code}`)
            .append(`<i class="icon-menu ${y.icon}"></i>`)
            .append(`<span class="expanded-sidebar title-menu">${y.name}</span>`)

          if (y.type == "folder") {
            $('#mainSidebar').find('#nav-main-menu')
              .find(`#menu-${y.code}`)
              .append(`<i class="expanded-sidebar dropdown-down fas fa-angle-down"></i>`)
              .append(`<i class="expanded-sidebar dropdown-up fas fa-angle-up"></i>`)

            $('#mainSidebar').find('#nav-main-menu')
              .append(`<section title-main-menu="${y.name}" value="show" class="${allowed} wrap-sub-menu ${y.type}" id="wrap-sub-menu-${y.code}"><label class="title-wrap-sub-menu">${y.name}</label></section>`)
          }

          console.log('createmenu', data)
          filterParent = data.filter(x => x.parent == y.id)
          menuLists[y.code] = y
          menuLists[y.code]["children"] = {}
          allowedChildren = 1
          if (Object.keys(filterParent).length > 0) allowedChildren = 0
          $.each(filterParent, function (__, child) {
            menuLists[y.code]["children"][child.code] = child
            if (currentUserMenuLevel[child.code].View == '1') allowedChildren++
            allowed = "not-allowed"
            if (currentUserMenuLevel[child.code].View == '1') allowed = "allowed"
            onclickNav = 'onclick="loadContent(this, \'\', \'' + child.code + '\', true)"'
            $('#mainSidebar').find('#nav-main-menu')
              .find(`#wrap-sub-menu-${y.code}`)
              .append(`<button title-main-menu="${child.name}" data-parent="${y.code}" value="show" ${onclickNav} class="${allowed} sub-menu ${child.type} centerized-sidebar" id="sub-menu-${child.code}"></button>`)
              .find(`#sub-menu-${child.code}`)
              .append(`<span class="expanded-sidebar title-menu">${child.name}</span>`)
          })
          if (allowedChildren < 1) $('#mainSidebar').find('#nav-main-menu .main-menu:last').removeClass('allowed').addClass('not-allowed')
        })
      }, complete: function () {
        slidebarButton = document.querySelector('#show-hide-slidebar')
        mainMenus.querySelector('.main-menu:nth-child(1)').click()

        document.querySelectorAll('.main-menu').forEach(menu => {
          menu.onmouseenter = function () { if (!mainSidebar.classList.contains('expand')) showTooltipSidebar(this) }
          menu.onmouseleave = function () { if (!mainSidebar.classList.contains('expand')) removeTooltipSidebar() }
        })

        if (userInfo['Group_position'] != "EP00") {
          console.log("REMOVE")
          document.querySelector('#menu-mst').remove()
          document.querySelector('#wrap-sub-menu-mst').remove()
          document.querySelector('#menu-user').remove()
          document.querySelector('#wrap-sub-menu-user').remove()
          document.querySelector('#menu-log_trail').remove()
        }
      }
    })
  })
}

function openSubMenu(el, value, menu, file) {
  if (document.querySelectorAll('.main-menu.open').length > 0) {
    document.querySelectorAll('.main-menu.open, .wrap-sub-menu.open').forEach(wrap => {
      if (wrap.getAttribute('id').includes(menu)) return
      wrap.classList.remove('open')
    })
  }

  el.classList.toggle('open')
  // document.querySelector(`#wrap-sub-menu-${menu}`).classList.remove('open')
  if (el.classList.contains('open')) {
    document.querySelector(`#wrap-sub-menu-${menu}`).classList.add('open')
  } else {
    document.querySelectorAll('.main-menu.folder').forEach(wrap => {
      wrap.classList.remove('open')
    })
    document.querySelectorAll('.wrap-sub-menu').forEach(wrap => { wrap.classList.remove('open') })
  }

  // IF SIDEBAR ARE SHRUNKEN AND MENU ARE SELECTED -->
  if (el.classList.contains('open') && !document.querySelector('#nav-main-menu').classList.contains('expand')) {
    mainTopHeight = el.offsetTop
    subMenuCount = document.querySelectorAll(`#wrap-sub-menu-${menu} button`).length
    wrapHeight = document.querySelector(`#wrap-sub-menu-${menu}`).offsetHeight / 2 / parseInt(subMenuCount) - (parseInt(subMenuCount - 1) * 10)
    console.log(mainTopHeight, document.querySelector(`#wrap-sub-menu-${menu}`).offsetHeight, 2, parseInt(subMenuCount), '-', (parseInt(subMenuCount - 1) * 10))

    document.querySelector(`#wrap-sub-menu-${menu}`).style.top = `calc(${mainTopHeight}px + ${wrapHeight}px)`
  }
}

// FUNCTION TO SHOW TOOLTIP ON MOUSE ENTER -->
function showTooltipSidebar(el) {
  pos1 = el.offsetTop;
  pos2 = el.offsetLeft;

  mainSection.querySelector('#tooltip-sidebar').innerText = el.getAttribute('title-main-menu')
  mainSection.querySelector('#tooltip-sidebar').style.top = `calc(${pos1}px + .1em)`
  mainSection.querySelector('#tooltip-sidebar').style.left = `calc(${pos2}px + 4em)`
  mainSection.querySelector('#tooltip-sidebar').style.visibility = 'visible'
  mainSection.querySelector('#tooltip-sidebar').style.zIndex = '99'
}

// FUNCTION TO HIDE TOOLTIP ON MOUSE LEAVE -->
function removeTooltipSidebar() {
  mainSection.querySelector('#tooltip-sidebar').style.visibility = 'hidden'
  mainSection.querySelector('#tooltip-sidebar').style.left = '-100%'
  mainSection.querySelector('#tooltip-sidebar').style.zIndex = '0'
}

// LOAD SELECTED DATA -->
function loadData(url, data) {
  return $.ajax({
    type: 'POST',
    url: url,
    data: data,
    dataType: 'JSON',
    success: function (response) {
    }
  })
}

// ----------------------------------------------------------LOGIN OR SESSIONS FUNCTIONS -->
// SET TIME OUT SESSION -->
function setTimerSession() {
  window.clearTimeout(timeOutSession)
  timeOutSession = window.setTimeout(function () {
    window.location = '/logout'
  }, 30 * 60 * 1000) //30 MINUTES -->
}

// RESET TIMEOUT IF THERE'S ACTIVITIES -->
function resetTimerSession() {
  clearTimeout(timeOutSession)
}

// ----------------------------------------------------------CONTENT AND ASSETS FUNCTIONS -->

// STYLESHEETS AND SCRIPTS --> domain
// NOTE : SOURCE LINK LIBRARY ICON
// - https://boxicons.com
// - https://icons.getbootstrap.com
// - https://remixicon.com
const allTheStylesheets = {
  // "styleesheets-doCss"                        : urlToAssets + '/css/doCss.min.css',
  "styleesheets-fa": urlToAssets + '/plugins/font-awesome/css/all.min.css',
  "styleesheets-box-icon": urlToAssets + '/plugins/boxicons-2-1-4/css/boxicons.min.css',
  "styleesheets-bostrap-icon": urlToAssets + '/plugins/bootstrap-icons/font/bootstrap-icons.min.css',
  "styleesheets-remix-icon": urlToAssets + '/plugins/remix-icon/remixicon.css',
  "styleesheets-select2": urlToAssets + '/plugins/select2/select2.min.css',
  "styleesheets-dataTables.bootstrap4": urlToAssets + '/plugins/datatables-plugin/datatables-bs4/css/dataTables.bootstrap4.min.css',
  "styleesheets-responsive.bootstrap4": urlToAssets + '/plugins/datatables-plugin/datatables-responsive/css/responsive.bootstrap4.min.css',
  "styleesheets-select.bootstrap4": urlToAssets + '/plugins/datatables-plugin/datatables-select/css/select.bootstrap4.min.css',
  "styleesheets-buttons.bootstrap4": urlToAssets + '/plugins/datatables-plugin/datatables-buttons/css/buttons.bootstrap4.min.css',
}

const allTheScripts = {
  "script-doJs": AppConfig.getScriptPath('doJs.js'),
  "script-doPdf": AppConfig.getScriptPath('doPdf.js'),
  "script-doCharts": AppConfig.getScriptPath('doChart.js'),
  "script-sweet-alert2": AppConfig.urlToAssets + '/plugins/sweetalert2/dist/sweetalert2.all.min.js',
  "script-select2": AppConfig.urlToAssets + '/plugins/select2/select2.min.js',
  "script-qrcode": AppConfig.urlToAssets + '/plugins/qrcode/qrcode.min.js',
  "script-jquery-dataTables": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables/jquery.dataTables.min.js',
  "script-datatables": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables/datatables.min.js',
  "script-dataTables.bootstrap4": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-bs4/js/dataTables.bootstrap4.min.js',
  "script-dataTables.responsive": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-responsive/js/dataTables.responsive.min.js',
  "script-responsive.bootstrap4": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-responsive/js/responsive.bootstrap4.min.js',
  "script-select.bootstrap4": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-select/js/select.bootstrap4.min.js',
  "script-dataTables.select": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-select/js/dataTables.select.min.js',
  "script-jspdf": AppConfig.urlToAssets + '/plugins/jspdf/jspdf.umd.min.js',
  "script-pdfjs": 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.min.js',
  "script-html2canvas-0-4-1": AppConfig.urlToAssets + '/plugins/html2canvas/html2canvas-0-4-1.min.js',
  "script-jszip": AppConfig.urlToAssets + '/plugins/jszip/jszip.min.js',
  "script-pdfmake": AppConfig.urlToAssets + '/plugins/pdfmake/pdfmake.min.js',
  "html5-qrcode": AppConfig.urlToAssets + '/plugins/html5-qrcode/html5-qrcode.min.js',
  "script-vfs_fonts": AppConfig.urlToAssets + '/plugins/fonts/vfs_fonts.js',
  "script-buttons.dataTable": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-buttons/js/dataTables.buttons.min.js',
  "script-buttons.bootstrap4": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-buttons/js/buttons.bootstrap4.min.js',
  "script-buttons.html5": AppConfig.urlToAssets + '/plugins/datatables-plugin/datatables-buttons/js/buttons.html5.min.js',
  "script-amchart.index": AppConfig.urlToAssets + '/plugins/amchart/index.js',
  "script-amchart.xy": AppConfig.urlToAssets + '/plugins/amchart/xy.js',
  "script-amchart.animated": AppConfig.urlToAssets + '/plugins/amchart/Animated.js',
  "script-amchart.dark": AppConfig.urlToAssets + '/plugins/amchart/Dark.js',
  "script-amchart.percent": AppConfig.urlToAssets + '/plugins/amchart/Percent.js',
  "script-web.rtc": AppConfig.urlToAssets + '/plugins/unreal-web-rtc/webrtcadapter.js',
  "script-web.rtc-player": AppConfig.urlToAssets + '/plugins/unreal-web-rtc/unrealwebrtcplayer.js',
  "script-chartJs": AppConfig.urlToAssets + '/plugins/chart-js/chart.min.js',
  "script-chartDataLabels": AppConfig.urlToAssets + '/plugins/chartjs-plugin-datalabels/chartjs-plugin-datalabels.min.js',
  "script-JsBarcode-3-11-6": AppConfig.urlToAssets + '/plugins/jsbarcode/JsBarcode-3-11-6.all.min.js'
};

// CALL FOOTER AND ITS SCRIPTS -->
$.each(allTheScripts, function (key, value) {
  addScripts(key, value)
})

// CALL HEADER AND ITS STYLESHEETS -->
$.each(allTheStylesheets, function (key, value) {
  addStylesheet(key, value)
})


// DYNAMICALLY ADDING STYLESHEETS TO MY HTML (JAVASCRIPT STYLE) -->
function addStylesheet(key, url, menu) {
  var link = document.createElement('link')
  link.href = url
  link.rel = 'stylesheet'
  link.id = key
  link.className = ''
  if (menu) link.className = "stylesheet-menu"
  document.getElementsByTagName('head')[0].appendChild(link)
}

// DYNAMICALLY ADDING SCRIPTS TO MY HTML (JAVASCRIPT STYLE) -->
function addScripts(id, src, cls) {
  const existing = document.getElementById(id);
  if (existing) existing.remove(); // remove old script

  const script = document.createElement('script');
  script.id = id;
  script.src = src + '?v=' + new Date().getTime(); // force reload
  script.className = `script-${cls}`;
  document.body.appendChild(script);
}


// ----------------------------------------------------------GENERAL FUNCTIONS -->
// REFRESH MENU WITHOUT RELOAD PAGE
function refreshMenu() {
  $('.main-menu .active:last').trigger('click')
}

// GO TOP -->
function scrollUp() {
  window.scrollTo(0, 0)
}

// HO DOWN -->
function scrollDown() {
  window.scrollTo(0, (document.body.scrollHeight))
}

// ----------------------------------------------------------LOADERS LIBRARY -->
const loadersLib = [
  "loader-diamonds", "loader-pulse", "loader-double-pulse", "loader-circles", "loader-three-dots",
  "loader-fade-circle", "loader-rectangle", "loader-rectangle-bounce", "loader-cubes",
  "loader-coffee-cup", "loader-timer", "loader-circle",
  "loader-typing", "loader-location", "loader-gauge", "loader-battery", "loader-square",
  "loader-magnifier", "loader-round-around", "loader-cloud", "loader-simple"
]

// FUNCTION FOR OPEN AND CLOSE LOADER -->
function openLoader() {
  $('#doLoader')
    .css('z-index', '150')
    .css('opacity', '1')
  setLoader($('#doLoader #loader-box'))
}

function closeLoader() {
  $('#doLoader')
    .css('z-index', '-150')
    .css('opacity', '0')
}

// FUNCTION FOR LOADERS -->
function setLoader(el) {
  type = loadersLib[Math.floor(Math.random() * loadersLib.length)]
  // type = loadersLib[4]
  el.removeClass().empty().append('<div class="' + type + '"></div>')
  if (type == "loader-diamonds") {
    for (let index = 1; index <= 4; index++) {
      el.find('.' + type).append('<div class="diamond diamond-' + index + '"></div>')
    }
  }
  if (type == "loader-double-pulse") {
    el.addClass('loader-box-double-pulse')
    for (let index = 1; index <= 2; index++) {
      el.find('.' + type).append('<div class="double-pulse"></div>')
    }
  }
  if (type == "loader-rectangle-bounce") {
    for (let index = 1; index <= 5; index++) {
      el.find('.' + type).append('<div class="rect-' + index + '"></div>')
    }
  }
  if (type == "loader-three-dots") {
    for (let index = 1; index <= 3; index++) {
      el.find('.' + type).append('<div class="three three-' + index + '"></div>')
    }
  }
  if (type == "loader-cubes") {
    for (let index = 1; index <= 9; index++) {
      el.find('.' + type).append('<div class="cube cube-' + index + '"></div>')
    }
  }
}
// SET BASIC HEADER FOR TABLE --ir
function setBasicHeaderFooterTable(el, data, sect) {
  el.empty().append('<tr></tr>');
  $.each(data, function (key, value) {
    el.find('tr:last').append('<th class="' + sect + '-' + key + '">' + value + '</th>')
  })
}

// SET TEMPLATE COLS TO APPEND TO SELECTED TABLE ROW --ir
function setTemplateCols(tableSelected) {
  let templateCols = ''
  $.each(tableSelected, function (key, obj) {
    templateCols += '<td class="col-' + key + '"></td>'
  })
  return templateCols
}

// HIDE SOME COLUMNS ON SELECTED TABLE --ir
function hideColumnsJQ(table, columns) {
  $.each(columns, function (i, col) {
    table.find('.col-' + col).hide()
    table.find('.head-' + col).hide()
  })
}

// HIDE SOME COLUMNS ON SELECTED TABLE --ir
function hideColumns(table, columns) {
  for (col of columns) {
    table.querySelectorAll('.col-' + col).forEach((bodyCol) => { bodyCol.style.display = 'none' })
    table.querySelectorAll('.head-' + col).forEach((headCol) => { headCol.style.display = 'none' })
  }
}

// SET ALL DATATABLE ON THIS MENU --ie
function setListsBasicDatatable(setTables) {
  for (table of setTables) {
    setBasicDatatable(
      tablesColumn[table],
      table,
      true,
      false,
      false,
      false,
      false
    )
  }
}

// SET MY BASIC DATATABLE --ir
function setBasicDatatable(column, table, showHead, showFoot, showSearch, showPagination, isClass) {
  if (isClass) isClass = "."
  else isClass = "#"
  if (showHead) setBasicHeaderFooterTable($(isClass + table + ' thead'), column, 'head')
  if (showFoot) setBasicHeaderFooterTable($(isClass + table + ' tfoot'), column, 'foot')
  if (showSearch) setSearch($("#card-" + table + " .search-bar"), table)
  if (showPagination) setRowsPerPage($("#card-" + table + " .row-page"), table)
}

function setBasicDataTablePlugin(table, select, pageLength, disabledDownload) {
  if (!pageLength) pageLength = 10
  if (!select) select = false;

  buttonDownload = []
  if (!disabledDownload) {
    buttonDownload = [
      'excelHtml5',
      'csvHtml5',
      {
        extend: 'pdfHtml5',
        orientation: 'landscape',
        pageSize: 'LEGAL'
      }
    ]
  }

  datatable = table.DataTable({
    "pageLength": pageLength,
    "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
    dom: 'lBfrtip',
    buttons: buttonDownload,
    destroy: true,
    "scrollX": true,
    "select": select,
    // "scrollY": "200px",
    "responsive": false,
    "processing": true,
    "serverSide": false,
    "PaginationType": "full_numbers",
    "language": {
      "processing": "<div></div><div></div><div></div>"
    }
  })
}

// ----------------------------------------------------------MODAL AND OVERLAY FUNTION -->
// FUNCTION TO FILL MODAL CONTENTS -->
// FILL MODAL CONTENT
function fillModalContent(modals) {
  const modalContainer = doModal;
  const defaultModal = '.default-modal';

  // Hapus semua modal kecuali default-modal
  modalContainer.querySelectorAll('.modal:not(' + defaultModal + ')').forEach(modal => modal.remove());

  // Menambahkan modal baru ke dalam container
  modals.forEach(modal => {
    const modalContent = document.querySelector(modal);
    if (modalContent) {
      modalContainer.prepend(modalContent);
    }
  });
}

// OPEN MODAL -->
function openModal(idModal) {
  const firstSection = documentSection[0];

  // Menyembunyikan overflow dari body
  firstSection.style.overflow = 'hidden';

  // Menampilkan modal
  doModal.style.left = "0px";

  // Menyembunyikan semua modal terlebih dahulu
  doModal.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');

  // Menampilkan modal yang diinginkan
  if (idModal) {
    const targetModal = doModal.querySelector(idModal);
    if (targetModal) targetModal.style.display = 'block';
  }
}

// CLOSE MODAL, SLIDEBAR ON CLICK WHITE SPACE MODAL -->
function triggerClickModal() {
  // Memeriksa apakah sidebar ditampilkan, jika ya, sembunyikan
  if (mainSection.classList.contains('show-slidebar')) {
    showSlidebar();
  }
}

// CLOSE MODAL -->
function closeModal() {
  const firstSection = documentSection[0];

  // Mengembalikan overflow body
  firstSection.style.overflow = 'unset';

  // Menutup modal dengan menggeser ke kiri
  doModal.style.left = "-100%";

  // Menghapus nilai input, select, dan textarea
  doModal.querySelectorAll('input, select, textarea').forEach(element => {
    element.value = '';
  });

  // Menyembunyikan semua modal
  doModal.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
}

// SHOW SLIDEBAR -->
function showSlidebar(el, value) {
  // IF THERE ARE NO VALUE THEN HIDE IT -->
  bodySection.setAttribute('swal-slidebar', 'no')
  if (value == "hide" || !value) {
    mainSection.classList.remove("show-slidebar");
    closeModal()
    return false
  }

  // IF TOGGLE CAN ONLY OPEN ON DASHBOARD ONLY, SHOW THIS -->
  if (el.classList.contains('dashboard-only')) {
    Swal.fire(
      'Hold on!',
      'Go back to dashboard to see any alerts.',
      'info',
    )
    return false
  }

  closeModal()
  mainSection.classList.toggle("show-slidebar")
  if (mainSection.classList.contains("show-slidebar")) {
    $('#doModal').css('left', '0px')
    bodySection.setAttribute('swal-slidebar', 'yes')
  }

  document.querySelectorAll('.slidebar-main-section').forEach((el) => { el.style.display = "none" })
  if (value) document.querySelector(`#${value}-slidebar-section`).style.display = "grid"

  slidebarTitle = el.getAttribute('data-title')
  slidebarIcon = el.querySelector('i').outerHTML
  if (value == "favorite") {
    document.querySelectorAll('.favorite-floor-filter')[0].click()
  }

  document.querySelector('#slidebar-title').innerHTML = slidebarIcon + "" + slidebarTitle
}

// LOAD LOG ACTIVITIES -->
function loadLogActivities(date) {
  logNoData = document.querySelector('#log-slidebar-no-data')
  logLists = document.querySelector('#log-slidebar-lists')
  $.ajax({
    url: 'loadLogTrail',
    type: 'GET',
    dataType: 'JSON',
    data: {
      date: date,
    },
    beforeSend: function () {
      logNoData.style.display = 'grid'
      logLists.style.display = 'none'
      logLists.style.opacity = '0'
      logLists.innerHTML = ''
    }, success: function (data) {
      if (Object.keys(data).length > 0) {
        logNoData.style.display = 'none'
        logLists.style.display = 'grid'
        document.querySelector('#log-slidebar-count').innerHTML = `<b>${Object.keys(data).length}</b> activities for today.`
        for (const logId in data) {
          logLists.innerHTML += `<section class="log-slidebar-box"></section>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<img class="log-slidebar-img" alt="">`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<span class="log-slidebar-name" >${data[logId].name}</span>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<span class="log-slidebar-time" >${data[logId].log_time}</span>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<hr></hr>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<span class="log-slidebar-menu" >${data[logId].menu}</span>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<span class="log-slidebar-activity" >${data[logId].activity_desc}</span>`
          document.querySelector('.log-slidebar-box:last-child .log-slidebar-img').setAttribute('src', `../../assets/images/employee_pictures/${data[logId].username}.jpg`)

          iconStatus = `<i class="fa fa-check-circle"></i>`
          if (data[logId].info != "success") iconStatus = `<i class="fa fa-times-circle"></i>`
          logLists.querySelector('.log-slidebar-box:last-child').innerHTML += `<span class="${data[logId].info} log-slidebar-info" >${iconStatus} <span>${firstUppercase(data[logId].info)}</span></span>`
        }
      }
    }, complete: function () {
      setTimeout(() => {
        logLists.style.opacity = '1'
        document.querySelectorAll('.log-slidebar-box .log-slidebar-img').forEach(photo => {
          photo.addEventListener('error', function handleError() {
            this.setAttribute('src', `../../assets/svgs/user-male.svg`)
          })
        })
      }, 50)
    }
  })
}

// ----------------------------------------------------------FIELDS -->

// SET PLUGIN SELECT 2 -->
function setPluginSelect2(elSelect, width, readonly) {
  $(elSelect).select2()
  $(elSelect).select2('destroy')
  $(elSelect).select2()
  if (width) $(elSelect).parent().find('.select2').css('width', width)
  if (readonly) $(elSelect).select2({ disabled: 'readonly' })
}

// CUSTOM PAD ZERO INTO STRING OR INT --it
function padZero(n, pad) {
  nLength = n.toString().length;
  if (nLength < pad) for (padIncrment = 0; padIncrment < pad - nLength; padIncrment++) n = '0' + n;
  return n;
}

// SET FIRST LETTER INTO UPPERCASE -->
function firstUppercase(string) {
  if (typeof string != 'string') return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// CONVERT STRING INTO TITLE CASE -->
function setTitleCase(string) {
  titleCase = '';
  for (const word of string.split(' ')) {
    titleCase += `${firstUppercase(word.toLowerCase())} `;
  }
  return titleCase;
}

function setZoomContent() {
  $('.zoomContent').css('zoom', zoomLevel + '%'); /* Webkit browsers */
  $('.zoomContent').css('zoom', parseFloat(zoomLevel / 100)); /* Other browsers */
  $('.zoomContent').css(
    '-moz-transform',
    scale(parseFloat(zoomLevel / 100), parseFloat(zoomLevel / 100))
  ); /* Moz-browsers */
}

// SET SCALE -->
function scale(x, y) {
  return 'scale(' + x + ',' + y + ')';
}

// FUNCTION CHECK PRIVILAGED -->
function checkPrivileged(act, menu, dontShow) {
  allowed = false
  if (currentUserMenuLevel[menu][firstUppercase(act)] == '1') {
    allowed = true
  }
  if (!allowed && !dontShow) {
    Swal.fire(
      "Sorry..",
      "You're not authorized to " + act + " on this menu.",
      "info"
    )
    return false
  }
  return allowed
}

// OPEN MODAL TO CHANGE PASS CURRENT USER OR CHANGE DEFAULT PASSWORD -->
function openChangePass() {
  if (userInfo.Group_position == "guest") return
  openModal(defaultModals[2])
  document.querySelectorAll('.form-pass input').forEach(field => { field.value = '' })
  modalChangePass.setAttribute('data-act', 'individual')
  modalChangePass.querySelector('#change-pass-username').innerHTML = `Change Password for ${userInfo.Name}`
  // if(userInfo.Group_position == "EP00") modalChangePass.querySelector('#change-password-default-button').style.display = `block`
  modalChangePass.querySelector('#set-change-password-button').value = `individual`
  modalChangePass.querySelector('#set-user-old-password').setAttribute("onchange", "checkPass(this, this.value, 'individual')")
}

// CHECK PASS FUNCTION -->
function checkPass(el, passInput, type) {
  if (type == "individual") username = userInfo.Username
  else if (type == "default-password") username = type
  else username = el.closest('.user-card.active').getAttribute('data-user')

  $.ajax({
    url: 'checkPass',
    method: 'POST',
    dataType: 'JSON',
    data: { username: username, oldPass: passInput },
    success: function (response) {
      if (response == "incorrect") {
        Swal.fire(
          "Incorrect!",
          "Please input correct password first!",
          "warning"
        )
        $(el).val('').focus()
      }
    }
  })
}

// CHECK PASS FUNCTION -->
function checkPassStd(el, value) {
  if (value.length < 6 || !hasUpperLowerCase(value, 'lower') || !hasUpperLowerCase(value, 'upper') || !hasNumber(value)) {
    Swal.fire(
      'Hold on!',
      'Password must be 6 characters. Contains lowercase, uppercase and numeric.',
      'info',
    )
  }
  el.value == ''
}

// FUNCTION TO CHECK IF STRING CONTAIN LOWERCASE OR UPPERCASE -->
function hasUpperLowerCase(str, check) {
  if (check == "lower") return str.toUpperCase() != str
  if (check == "upper") return str.toLowerCase() != str
}

// FUNCTION TO CHECK IF STRING HAS NUMBER -ir
function hasNumber(str) {
  return /\d/.test(str)
}

// FUNCTIN TO UPDATE PASSWORD -->
function changePassIndividualHandler(act) {
  document.querySelector("#set-user-old-password").onchange()

  oldPass = document.querySelector('#set-user-old-password').value
  newPass = document.querySelector('#set-user-new-password').value
  retypePass = document.querySelector('#set-user-retype-password').value
  if (oldPass == "" || newPass == "" || retypePass == "") {
    Swal.fire(
      "Hold on!",
      "Please input all field first!",
      "warning"
    )
    return false
  }

  if (newPass != retypePass) {
    Swal.fire(
      "Hold on!",
      "New password and retype new password did not match!",
      "warning"
    )
    return false
  }

  username = userInfo.Username
  if (act == "default-password") username = act

  $.ajax({
    url: 'changePass',
    method: 'POST',
    dataType: 'JSON',
    data: { id: userInfo.Id, username: username, newPass: newPass },
    beforeSend: function () {
      openLoader()
    }, success: function (response) {
      if (response == "failed") {
        Swal.fire(
          "Failed!",
          "Failed to change passowrd!",
          "warning"
        )
      } else {
        closeModal()
        Swal.fire(
          "Success!",
          "Success updated a new password.",
          "success"
        )
      }
    }, complete: function () {
      closeLoader()
    }
  })
}

// WAIT FOR VERIFY PASSOWRD FIRST -->
function verifyPassword(el, value) {
  setTimeout(() => {
    document.querySelector("#set-user-password").onchange()
  }, 2000);

  if (document.querySelector("#set-user-password").value) {
    // OPEN SETTING DEFAULT PASSWORD -->
    if (value == "change-password-default") {
      openModal(defaultModals[2])
      modalChangePass.querySelector('#set-user-old-password').value = ``
      modalChangePass.querySelector('#set-user-new-password').value = ``
      modalChangePass.querySelector('#set-user-retype-password').value = ``

      modalChangePass.setAttribute('data-act', 'default-password')
      modalChangePass.querySelector('#change-pass-username').innerHTML = `Change <b>default password</b> for all users`
      modalChangePass.querySelector('#set-change-password-button').value = `default-password`
      modalChangePass.querySelector('#set-user-old-password').setAttribute("onchange", "checkPass(this, this.value, 'default-password')")
      modalChangePass.querySelector('#change-password-default-button').style.display = `none`
    }
  }
}

// SEE PASS -->
function seePassIndividualHandler(el, act) {
  el.querySelector('i').setAttribute('class', '')

  if (act == "see") {
    el.value = "show"
    el.querySelector('i').classList.add('fa', 'fa-eye')
    el.classList.add('active')
    el.closest('.form-pass').querySelector('input').setAttribute('type', 'text')
  } else {
    el.value = "hide"
    el.classList.remove('active')
    el.querySelector('i').classList.add('fa', 'fa-eye-slash')
    el.closest('.form-pass').querySelector('input').setAttribute('type', 'password')
  }
}

// FUNCTION TO OPEN CHANGE USER PHOTO -->
function openChangePict() {
  openModal(defaultModals[3])
  modalChangePhoto.querySelector('#change-pict-preview').setAttribute('src', document.querySelector('#header-user-info-img').getAttribute('src'))
  modalChangePhoto.querySelector('#change-pict-preview').addEventListener('error', function handleError() {
    this.setAttribute('src', `../../assets/svgs/user-male.svg`)
  })
}

// FUNCTION TO CHANGE IMAGE PREVIEW ON CHANGE USER PHOTO -->
function changePictEmployee(el) {
  changePictureEmployeeValue = el.files[0]

  if (!changePictureEmployeeValue.type.includes("image")) {
    Swal.fire(
      'Hold on!',
      'Upload image only.',
      'info'
    )
    return false
  }

  document.querySelector('#change-pict-preview').setAttribute('src', URL.createObjectURL(changePictureEmployeeValue))
  document.querySelector('#change-pict').value = ''
}

// FUNCTION TO CHANGE USER PHOTO -->
function changePictureEmployee() {
  pictureData = new FormData()
  nameFileOld = "none"
  nameFileOldSplit = "none"
  if (document.querySelector('#header-user-info-img').getAttribute('src').includes('employee_pictures')) {
    nameFileOld = document.querySelector('#header-user-info-img').getAttribute('src').split("employee_pictures/")
    nameFileOldSplit = nameFileOld[1].split('?')[0]
  }

  pictureData.append("fileOld", nameFileOldSplit)
  pictureData.append("fileNew", changePictureEmployeeValue.name)
  pictureData.append("fileExt", (changePictureEmployeeValue.name).split('.')[1])
  pictureData.append("file", changePictureEmployeeValue)
  pictureData.append("username", userInfo.Username)
  pictureData.append("name", userInfo.Name)

  Swal.fire({
    title: "Hold on!",
    text: "Are you sure to change it?",
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["mtb-clr-blu-1"],
    cancelButtonColor: colorThemes["mtb-clr-red-2"],
    confirmButtonText: "Yes, change it!",
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'changePictureEmployee',
        type: "POST",
        processData: false,
        contentType: false,
        data: pictureData,
        beforeSend: function () {
          openLoader()
        },
        success: function (result) {
          if (result == "success") {
            Swal.fire(
              'Success',
              "Success to change picture",
              'success',
            )
            console.log(changePictureEmployeeValue.name)
          } else {
            Swal.fire(
              'Failed',
              "Failed to change picture",
              'warning',
            )
          }
        },
        complete: function () {
          closeLoader()
          closeModal()

          // SIDEBAR PHOTO SECTION -->
          document.querySelector('#header-user-info-img').setAttribute('src', `../../assets/images/employee_pictures/${userInfo['Username']}.jpg`)
          document.querySelector('#header-user-info-img').addEventListener('error', function handleError() {
            this.setAttribute('src', `../../assets/svgs/user-male.svg`)
          })

          // SLIDEBAR PHOTO SECTION -->
          document.querySelector('#slidebar-user-info-img').setAttribute('src', `../../assets/images/employee_pictures/${userInfo['Username']}.jpg`)
          document.querySelector('#slidebar-user-info-img').addEventListener('error', function handleError() {
            this.setAttribute('src', `../../assets/svgs/user-male.svg`)
          })
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire(
        'Cancelled',
        "Cancel to change picture",
        'info'
      )
    }
  })
}

// IS EVEN -->
function isEven(num) { return num % 2 == 0 }

// IS ODD -->
function isOdd(num) { return Math.abs(num % 2) == 1 }

// GET RANDOM NUMBER ON RANGE -->
function getRandomRangeNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// FUNCTION TO SHOW UP INFO THAT FEATURE OR MENU ARE STILL ON DEVELOPMENT -->
function stillOnDevelopment() {
  Swal.fire({
    title: 'Sorry..',
    text: 'This feature / menu are still in development.',
    imageUrl: '/assets/svgs/waiting.png',
    imageWidth: '400px',
    imageAlt: 'Custom image',
  })
  return
}

//Make the DIV element draggagle:
function dragElement(elmnt) {
  elmnt.setAttribute('data-left', elmnt.offsetLeft)
  elmnt.setAttribute('data-top', elmnt.offsetTop)
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0
  if (document.getElementById(elmnt.id)) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id).onmousedown = dragMouseDown
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown
  }

  function dragMouseDown(e) {
    e = e || window.event
    e.preventDefault()
    // get the mouse cursor position at startup:
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag
  }

  function elementDrag(e) {
    e = e || window.event
    e.preventDefault()
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px"
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"
    elmnt.setAttribute('data-top', (elmnt.offsetTop - pos2))
    elmnt.setAttribute('data-left', (elmnt.offsetLeft - pos1))
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null
    document.onmousemove = null
  }
}

// CHANGE TIMER INTERVAL -->
function changeTimerSession(el, act) {
  selectedTimerAct = timerSession
  textTitle = "Timer Session"
  textQ = "timer before auto logout"
  textTime = 'minute(s)'

  if (act == "countdown") {
    textTitle = "Countdown Session"
    textQ = "countdown before auto logout"
    selectedTimerAct = countdownSession
    textTime = 'second(s)'
  }

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 

  if (!el.value) {
    el.value = selectedTimerAct
    return false
  }

  infoSwal = `<span>${textTitle} Before : <b> ${selectedTimerAct} ${textTime}</b></span><br> `
  infoSwal += `<span>${textTitle} After : <b> ${el.value} ${textTime}</b></span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to change ${textQ}? <br><br> ${infoSwal}`,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes["b7-clr-org-1"],
    confirmButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: `<i class="fas fa-power-off"></i> Yes, change ${textTitle.toLowerCase()}!`,
    confirmButtonAriaLabel: 'Change!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'updateTimerSessionSetting',
        method: 'POST',
        dataType: 'JSON',
        data: {
          timeBefore: selectedTimerAct,
          timeAfter: el.value,
          act: act.replaceAll("-", "_"),
          textQ: textQ,
          textTime: textTime,
        },
        beforeSend: function () {
          openLoader()
          clearInterval(idleInterval)
        }, success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully to change ${textQ}! <br><br> ${infoSwal}`,
            })
            if (act == "timer") {
              timerSession = el.value
              settingLists[0].timer_session = el.value
            } else if (act == "countdown") {
              countdownSession = el.value
              settingLists[0].countdown_session = el.value
            }
          } else {
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to change ${textQ}! <br><br> ${infoSwal}`,
            })
            el.value = selectedTimerAct
          }
        }, complete: function () {
          closeLoader()
          idleInterval = setInterval(autoLogout, ((minutesToSeconds(timerSession) * 1000) / 10)) // CONVERT TO MILISECOND AND DIVIDED BY 10 FOR COUNTDOWN TIMER -->
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to change ${textQ}! <br><br> ${infoSwal}`,
      })
    }
  })
}

// FUNCTION TO CHANGE DEFAULT OPTION FOR SELECTED USER (USER SETTINGS) -->
function changeUserOptSetting(el, value, act) {
  setAndremoveClassActive(el, '.' + el.getAttribute('data-class'), '#' + el.parentElement.getAttribute('id'))
  if (act == "slideshow") {
    valueBefore = selectedSlideshow
    selectedSlideshow = value
    textTitle = "Default slideshow"
    textQ = "default slideshow on dashboard menu"
  } else if (act == "theme") {
    valueBefore = selectedTheme
    selectedTheme = value
    textTitle = "Default Theme"
    textQ = "default theme"
  } else if (act == "sidebar") {
    valueBefore = sidebarMode
    sidebarMode = value
    textTitle = "Default Sidebar Mode"
    textQ = "default sidebar mode"
  } else if (act == "type_chart") {
    valueBefore = selectedTypeChart
    selectedTypeChart = value
    textTitle = "Default Type Chart Mode"
    textQ = "default type chart mode"
  }

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 

  if (!el.value) {
    el.value = valueBefore
    return false
  }

  infoSwal = `<span>${textTitle} Before : <b> ${firstUppercase(valueBefore)}</b></span><br> `
  infoSwal += `<span>${textTitle} After : <b> ${firstUppercase(value)}</b></span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to change ${textQ}? <br><br> ${infoSwal}`,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes["b7-clr-org-1"],
    confirmButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: `<i class="fas fa-power-off"></i> Yes, change ${textTitle.toLowerCase()}!`,
    confirmButtonAriaLabel: 'Change!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'updateUserSetting',
        method: 'POST',
        dataType: 'JSON',
        data: {
          user_id: userInfo.Id,
          username: userInfo.Username,
          valueBefore: valueBefore,
          valueAfter: value,
          textQ: textQ,
          act: act,
        },
        beforeSend: function () {
          openLoader()
        }, success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully to change ${textQ}! <br><br> ${infoSwal}`,
            })
            if (act == "theme") {
              selectedTheme = value
              bodySection.classList.remove('white-theme')
              bodySection.classList.add(value)
            }
            if (act == "slideshow") selectedSlideshow = value
            if (act == "sidebar") {
              sidebarMode = value
              mainSection.classList.remove('expand', 'shrink', 'fixed')
              mainSection.classList.add(value)
              mainSidebar.classList.remove('expand', 'fixed')
              mainSidebar.classList.add('fixed')
              if (value == "fixed") mainSidebar.classList.add('expand')
            }
            if (act == "type_chart") selectedTypeChart = value
            settingLists[0]["selected_" + act] = value
          } else {
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to change ${textQ}! <br><br> ${infoSwal}`,
            })
            el.value = valueBefore
          }
        }, complete: function () {
          closeLoader()
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to change ${textQ}! <br><br> ${infoSwal}`,
      })
    }
  })

}

// FUNCTION TO DELETE LOG TRAIL -->
function deleteLogTrail(el) {
  pastMonthsDeleteLogTrail = document.querySelector('#delete-log-trail-interval').value
  if (!pastMonthsDeleteLogTrail) {
    Swal.fire(
      'Hold on!',
      'Please input how many past month(s) first.',
      'info',
    )
    return false
  }

  textTitle = "Delete Log Trail"
  textQ = "delete log trail in past <b>" + pastMonthsDeleteLogTrail + " month(s)</b>"

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 

  infoSwal = `<span>${firstUppercase(textQ)}</span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to ${textQ}?`,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes["b7-clr-org-1"],
    confirmButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: `<i class="fas fa-power-off"></i> Yes, ${textTitle.toLowerCase()}!`,
    confirmButtonAriaLabel: 'Change!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'deleteLogTrail',
        method: 'POST',
        dataType: 'JSON',
        data: {
          interval: pastMonthsDeleteLogTrail,
          textQ: textQ,
        },
        beforeSend: function () {
          openLoader()
        }, success: function (data) {
          if (data.includes("success") || data.includes("info")) {
            if (data.split("-")[1] > 0) htmlSwal = `Successfully to ${textQ}! <br><br> ${data.split("-")[1]} log trail(s) deleted.`
            else htmlSwal = "There are nothing to delete, there are no data older than " + pastMonthsDeleteLogTrail + " month. "
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: data.split("-")[0],
              html: htmlSwal,
            })
          } else {
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to ${textQ}! <br><br> ${infoSwal}`,
            })
          }
        }, complete: function () {
          closeLoader()
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to ${textQ}! <br><br> ${infoSwal}`,
      })
    }
  })
}

// FUNCTION TO GET MOST OR LEAST VALUES ON ARRAY -->
function getMostLeastArr(arr, minMax) {
  const hashmap = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1
    return acc
  }, {})
  if (minMax == 'least') {
    return Object.keys(hashmap).reduce((a, b) => hashmap[a] < hashmap[b] ? a : b)
  }
  if (minMax == 'most') {
    return Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b)
  }
}

// CHECK IF FORM INPUT ARE INPUTTED OR NOT (INDIVIDUALLY ON ARRAY) -->
function checkFieldAreInputed(listInput) {
  let result = listInput.filter((input) => input === '').length
  return result === 0 ? true : false
}

// CHECK IF FORM INPUT ARE INPUTTED OR NOT (GROUP AND EXCEPTIONS) -->
function checkFieldAreInputedOnGroup(group, exception, exceptionGroup) {
  let empty = 0
  group = document.querySelector(group)
  group.querySelectorAll('input, select, textarea').forEach(field => {
    exceptionGroupCount = 0
    if (exceptionGroup && field.closest(exceptionGroup)) exceptionGroupCount = field.closest(exceptionGroup).querySelectorAll('input, select, textarea').length
    if (!exception.includes(field.getAttribute('id')) && (exceptionGroupCount <= 0) && (!field.value || field.value == '')) empty++
    console.log(field.getAttribute('id'), empty, !exception.includes(field.getAttribute('id')))
  })
  return empty > 0 ? false : true
}

// EMPTY ALL FIELDS ON GROUP SECTION -->
function emptyFields(group, exception) {
  group = document.querySelector(group)
  group.querySelectorAll('input, select, textarea').forEach(field => {
    if (!exception.includes(field.getAttribute('id'))) field.value = ''
  })
}

// GET SELECTED OPTION TEXT -->
function getSelectedOptionText(el) {
  return el.options[el.selectedIndex].text
}

// CREATE CALENDAR -->
function createCalendar(parent, fullDateCalendar) {
  if (fullDateCalendar) {
    if (returnSelectedDateConvert(fullDateCalendar, "ymd").split("-")[0] + "-" + returnSelectedDateConvert(fullDateCalendar, "ymd").split("-")[1] == todayYMD.split("-")[0] + "-" + todayYMD.split('-')[1]) fullDateCalendar = new Date()
    else fullDateCalendar = fullDateCalendar
  } else fullDateCalendar = new Date()
  periode = padZero((fullDateCalendar.getMonth() + 1), 2) + "-" + fullDateCalendar.getFullYear()
  numberOfDays = new Date(fullDateCalendar.getFullYear(), fullDateCalendar.getMonth() + 1, 0).getDate()

  if (parent.querySelectorAll('.calendar-box').length > 0) parent.querySelector('.calendar-box').remove()
  parent.innerHTML = '<table data-period="' + returnSelectedDateConvert(fullDateCalendar, 'ymd') + '" class="calendar-box"><thead></thead><tbody></tbody></table>'
  tableCalendar = parent.querySelector('.calendar-box')
  tableCalendar.querySelector('thead').innerHTML = '<tr></tr>'

  for (let x = 0; x < dayNamesStartMon.length; x++) {
    tableCalendar.querySelector('thead tr:last-child').innerHTML += '<td align="center">' + dayNamesStartMon[x] + '</td>'
  }

  dayPos = 1
  for (let x = 1; x <= numberOfDays; x++) {
    dt = new Date(fullDateCalendar.getFullYear() + ", " + padZero((fullDateCalendar.getMonth() + 1), 2) + ", " + x)
    if (dayPos > 7) dayPos = 1
    if (dayPos++ == 1) { tableCalendar.querySelector('tbody').innerHTML += '<tr></tr>' }
    if (dt.getDay() == 0 || dt.getDay() == 6) classDate = 'weekend'; else classDate = 'weekday';
    if (x == 1) {
      for (let y = 0; y < dayNamesStartMon.length; y++) {
        dayY = y + 1
        if (!dayNamesStartMon[dayY]) dayY = 0
        if (dt.getDay() == (dayY)) { tableCalendar.querySelector('tbody tr:last-child').innerHTML += '<td align="center"><button data-day="' + x + '" id="date-' + x + '" class="day ' + classDate + '">' + x + '</button></td>'; break; }
        else {
          tableCalendar.querySelector('tbody tr:last-child').innerHTML += '<td class="not-date"></td>'
          dayPos++
        }
      }
    }
    else tableCalendar.querySelector('tbody tr:last-child').innerHTML += '<td align="center"><button data-day="' + x + '" id="date-' + x + '" class="day ' + classDate + '">' + x + '</button></td>'
    if (x == fullDateCalendar.getDate() && fullDateCalendar.getMonth() == new Date().getMonth() && fullDateCalendar.getFullYear() == new Date().getFullYear())
      tableCalendar.querySelector(`button[data-day="${x}"]`).classList.add('today')
  }
}

// (DRAG, DROP AND SORT) SECTION ON ALLOW DRAG AND DROP -->
function allowDrop(e) {
  e.preventDefault();
}

var rowDrag

// (DRAG, DROP AND SORT) WHEN ELEMENT ARE OVER ON ANOTHER ELEMENT -->
function dragOver(e) {
  e.preventDefault()
  rowDrag.classList.add('hidden')
  if (isBeforeDrag(rowDrag, e.target))
    e.target.parentNode.insertBefore(rowDrag, e.target)
  else
    e.target.parentNode.insertBefore(rowDrag, e.target.nextSibling)
}

// (DRAG, DROP AND SORT) WHEN ELEMENT ARE RELEASED FROM DRAG EVENT -->
function dragEnd() {
  rowDrag.classList.remove('hidden')
  rowDrag = null
}

// (DRAG, DROP AND SORT) WHEN ELEMENT ARE DRAGGED -->
function dragStart(e) {
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", null)
  rowDrag = e.target
}

// (DRAG, DROP AND SORT) CHECK IF HOVERED ELEMENT IS BEFORE OR NOT -->
function isBeforeDrag(el1, el2) {
  if (el1.parentNode === el2.parentNode)
    for (var cur = el1.previousSibling; cur; cur = cur.previousSibling)
      if (cur === el2) return true
  return false
}

// SVG TO BASE64
function getBase64Image(img, imgSize) {
  return new Promise(function (resolve, reject) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    // Create an image from the SVG data
    var image = new Image();
    image.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(img));
    // Wait for the image to load
    image.onload = function () {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);
      // Convert canvas to base64 data URL
      var dataURL = canvas.toDataURL('image/jpeg', imgSize);
      resolve(dataURL);
    };
  });
}



// EXPORT EXCEL
function exportToExcel(tableName, fileName = '') {
  var tableText = "<table border = '1px'><tr>";
  var textRange;
  var j = 0;
  table = document.getElementById(tableName)

  for (let j = 0; j < table.rows.length; j++) {
    // console.log(tableText + table.rows[j].innerHTML)
    tableText = tableText + table.rows[j].innerHTML + "</tr>"
  }

  tableText = tableText + "</table>"
  tableText = tableText.replace(/<input[^>]*>|<\/input>/gi, "")
  fileName = fileName ? fileName + '.xls' : 'excel_data.xls'

  var dataType = 'application/vnd.ms-excel'
  downloadLink = document.createElement('a')
  document.body.appendChild(downloadLink)
  downloadLink.href = 'data:' + dataType + ', ' + encodeURIComponent(tableText)
  downloadLink.download = fileName
  downloadLink.click()
  document.querySelector('a[download]').remove()
}

// HANDLER FOR SEARCHING FROM EL FROM SECTION LISTS ON KEY UP -->
function searchValueFromLists(value, ms, msNoData, elClass, elLayout, msLayout, msNoDataLayout) {
  console.log(value)
  let search = value.toLowerCase()
  foundOne = false
  ms.style.display = 'none'
  msNoData.style.display = msNoDataLayout
  document.querySelectorAll(`.${elClass}`).forEach(card => {
    found = false
    card.style.display = 'none'
    if (found) return true
    if (card.innerText.toLowerCase().indexOf(search) > -1) {
      card.style.display = elLayout
      found = true
      foundOne = true
    }
  })
  if (foundOne) {
    ms.style.display = msLayout
    msNoData.style.display = 'none'
  }
}

// GET YEAR, MONTH AND DAYS FROM TOTAL DAYS -->
function getYearMonthDayFromDays(totDays, excludeZero) {
  let years = Math.floor(totDays / 365)
  let months = Math.floor((totDays % 365) / 30)
  let days = Math.floor((totDays % 365) % 30)
  if (excludeZero) {
    text = ''
    if (years) text += years + " years, "
    if (months) text += months + " months, "
    if (days) text += days + " days"
    return text
  } else return { years, months, days }
}

// CHECK IF FIRST CHARACTHER IN WORDS INCLUDE SELECTED CHAR -->
function isFirstCharInclude(string, firstChar, act) {
  let words = string.split(' ')
  if (words.length > 0) {
    let firstWord = words[0]
    if (firstWord.charAt(0) === firstChar) {
      if (act == "remove") {
        firstWord = firstWord.substring(1)
        words[0] = firstWord
        words.join(' ')
        return words
      }
      return true
    }
  }
  return false
}

let html5QrCode;
let isScanning = false;
let currentCamera = "environment";
let scannedValue = "";