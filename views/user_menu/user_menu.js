menuListsSection = document.querySelector('#menu-lists')
menuListsSectionNoData = document.querySelector('#menu-lists-no-data')

// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

// ADD CONTENT MODAL --ir
modals = ["#modal-privileged-menu"]
fillModalContent(modals)
modalPrivilegedMenu = document.querySelector(modals[0])
actPrivilegeList = ['view', 'insert', 'update', 'delete', 'approve', 'print', 'upload', 'reason', 'auth']
for (const act in actPrivilegeList) {
  modalPrivilegedMenu.querySelector('#modal-privileged-menu-acts').innerHTML += `<button data-children="no" onclick="updateMenuLevel(this)" class="button-set button-privileged" data-status="0" data-col="${actPrivilegeList[act]}" id="button-privileged-${actPrivilegeList[act]}">${firstUppercase(actPrivilegeList[act])}</button>`
}

menuListsSection = document.querySelector('#menu-lists')
setGroupPosition('')
loadMenus()
privilegedListsGroup = {}

// FUNCTION TO SET GROUP LISTS --ir
function setGroupPosition(floor) {
  groupPositionSection = document.querySelector('#group-lists')
  groupPositionFilterSection = document.querySelector('#group-filter')
  groupPositionSection.innerHTML = ''
  groupPositionFilterSection.innerHTML = ''
  
  loadData('loadGroupPositon').then(function(newData) {
    groupLists = newData
  }).then(() => {
    openLoader()
  }).then(() => {
    for (key in groupLists) {
      groupPositionSection.innerHTML += `<button value="${key}" onclick="changeGroupPosition(this, this.value)" class="group-button" data-position="${key}">${groupLists[key].position_name}</button>`
    }
    groupPositionFilterSection.innerHTML += `<input placeholder="Search Menu" id="search-menu-field" class="search-menu"> `
    groupPositionSection.querySelectorAll('button')[0].click()
  }).then(() => {
    closeLoader()

    // HANDLER TO SEARCH USER CARD --ir
    document.querySelector('#search-menu-field').onkeyup = function() {
      let search = this.value.toLowerCase()
      foundOne = false
      document.querySelector('#menu-lists').style.display = 'none'
      document.querySelector('#menu-lists-no-data').style.display = 'grid'
      document.querySelectorAll('.menu-card').forEach(card => {
        found = false
        card.style.display = 'none'
        card.querySelectorAll('.menu-info-title, .child-title').forEach(field => {
          if(found) return true
          if(field.innerText.toLowerCase().indexOf(search) > -1){
            card.style.display = 'grid'
            found = true
            foundOne = true
          }
        })
      })
      if(foundOne){
        document.querySelector('#menu-lists').style.display = 'grid'
        document.querySelector('#menu-lists-no-data').style.display = 'none'
      }
    }
  })
}

// CHANGE GROUP POSITION AND SET MENU AUTH VALUES --ir
function changeGroupPosition(el, value) {
  setAndremoveClassActive(el, '.group-button', '#group-lists', false, false)
  menuListsSection.style.display = 'none'
  menuListsSectionNoData.style.display = 'grid'
  colActs = ["view", "update", "delete", "print"]
  $.ajax({
    url: 'loadUserMenu',
    type: 'POST',
    dataType: "JSON",
    data: {
      userGroup: value,
    }, beforeSend: function (){
      openLoader()
    }, success: function (data){
      if(Object.keys(data).length > 0){
        menuListsSection.style.display = 'grid'
        menuListsSectionNoData.style.display = 'none'
        privilegedListsGroup = data
        // COUNT ALLOWED AND DENIED ON PRIVILAGED MASTER --ir
        countAllowed = 0
        countDenied = 0
        menuBefore = ''
        infoCountStatusMenu = {}
        console.log(data)
        for (const menu in data) {
          // RESET COUNTING STATUS PRIVILAGED MENU --ir
          if(menuBefore != menu.split("_")[0]){
            countAllowed = 0
            countDenied = 0
          }
          // LOOP BASED ON ACT STATUS --ir
          for (const colAct of colActs) {
            statusAuth = data[menu][firstUppercase(colAct)]
            cardButtonAct = document.querySelector(`.act-button[data-menu="${menu}"][data-col="${colAct}"]`)
            if(!cardButtonAct) continue
            cardButtonAct.setAttribute('data-status', statusAuth)
            // COUNT BASED ON MENU PRIVILAGED STATUS --ir
            if(statusAuth != "1") countDenied++
            else countAllowed++
  
            // IF MENU HAS CHILDRENS, THEN SET BUTTON ACT INSIDE IT --ir
            if(!cardButtonAct.getAttribute('data-children')){
              cardButtonAct.innerHTML = `Yes`
              cardButtonAct.classList.remove('deny')
              if(statusAuth != "1"){
                cardButtonAct.innerHTML = `No`
                cardButtonAct.classList.add('deny')
              }
            }
          }
  
          // PUSH AND REPLACE INFO COUNTING STATUS MENU BASED ON MENU CODE --ir
          infoCountStatusMenu[menu.split("_")[0]] = [countAllowed, countDenied]
          menuBefore = menu.split("_")[0]
        }
        
        // SET INFO STATUS ON MAIN CARD MENU --ir
        for (const mst in infoCountStatusMenu) {
          // if(mst == 'settings') continue
          infoStatusText = `<i class="fa fa-check-circle"></i> Allowed`
          if(infoCountStatusMenu[mst][0] < infoCountStatusMenu[mst][1] && infoCountStatusMenu[mst][1] > 0) infoStatusText = `<i class="fa fa-info-circle"></i> Some of them are allowed`
          if(infoCountStatusMenu[mst][0] == infoCountStatusMenu[mst][1] && infoCountStatusMenu[mst][1] > 0) infoStatusText = `<i class="fa fa-info-circle"></i> Some of them are allowed`
          if(infoCountStatusMenu[mst][0] > infoCountStatusMenu[mst][1] && infoCountStatusMenu[mst][1] > 0) infoStatusText = `<i class="fa fa-info-circle"></i> Some of them are denied`
          if(infoCountStatusMenu[mst][0] == 0) infoStatusText = `<i class="fas fa-exclamation-triangle"></i> Denied`
          document.querySelector(`.menu-section[data-parent="${mst}"] .menu-info-allow`).innerHTML = `${infoStatusText}`
        }
      } 

    }, complete: function(){
      closeLoader()
    }
  })
}

// OPEN MENU CHILFREN'S --ir
function seeMenuInfo(el, value) {
  hasChildrens = el.getAttribute('data-children')
  if(hasChildrens <= 0 ){
    Swal.fire(
      'Hold on!',
      'Didn\'t have children',
      'warning',
    )
    return false
  }
  setAndremoveClassActive(el, '.menu-section', '.menu-card', true, false)
  document.querySelectorAll('.menu-card').forEach((card) => { card.querySelector('.menu-detail').style.display = 'none' })
  el.parentNode.querySelector('.menu-detail').style.display = 'grid'
}

// LOAD ALL MENU AND ITS SUB MENUS --ir
function loadMenus(el, value) {
  for (menuCode in menuLists) {
    menuChildrenText = "Didn't have sub menus."
    menuChildren = menuLists[menuCode].children
    menuChildrenLength = Object.keys(menuLists[menuCode].children).length
    if(menuChildrenLength > 0) menuChildrenText = `Has ${menuChildrenLength} sub menu(s).`
    
    menuListsSection.innerHTML += `<div class="menu-card" data-menu="${menuCode}"></div>`
    menuCard = menuListsSection.querySelector('.menu-card:last-child')

    menuCardDefaultSection = `<section onclick="seeMenuInfo(this, this.value)" class="menu-section" data-menu="${menuCode}" data-parent="${menuCode.split('_')[0]}" data-children="${menuChildrenLength}"></section>`
    if(menuChildrenLength <= 0) menuCardDefaultSection = `<section onclick="showActPrivilegeMenu(this, this.value)" class="menu-section act-button" data-menu="${menuCode}" data-parent="${menuCode.split('_')[0]}" data-children="no" data-children="${menuChildrenLength}" data-col="view" data-status="1"></section>`
    
    // CARD MENU HEADER --ir
    menuCard.innerHTML += menuCardDefaultSection
    menuHead = menuCard.querySelector('.menu-section:last-child')
    
    // PHOTO --ir
    menuImage = `../../assets/svgs/time5.svg`
    menuHead.innerHTML += `<img id="menu-photo-${menuCode}" src="${menuImage}" class="menu-photo">`
    
    // MENU PRIVILAGED INFO --ir
    menuHead.innerHTML += `<div class="menu-info"></div>`
    menuHead.querySelector('.menu-info:last-child').innerHTML =  `<span class="menu-info-title">${menuLists[menuCode].name}</span>`
    menuHead.querySelector('.menu-info:last-child').innerHTML += `<span class="menu-info-children">${menuChildrenText}</span>`
    menuHead.querySelector('.menu-info:last-child').innerHTML += `<span class="menu-info-allow">-</span>`
    
    // CARD USER DETAIL --ir
    menuCard.innerHTML += `<section class="menu-detail" data-menu="${menuCode}"></section>`
    menuDetail = menuCard.querySelector('.menu-detail:last-child')
    if(menuChildrenLength <= 0) continue
    
    // USER UPDATE GROUP --ir
    menuDetail.innerHTML += `<div data-section="info" class="menu-children-lists"></div>`
    menuDetail.querySelector('.menu-children-lists:last-child').innerHTML = `<table class="menu-children-table"><thead><tbody></table>`
    menuDetail.querySelector('.menu-children-lists:last-child thead').innerHTML =  `<tr><td>Sub Menu</td></tr>`

    // SET HEADER COOLUMN BASED ON ACT PRIVILEGES LISTS --ir
    for (const actPrivilege of actPrivilegeList) {
      if(menuCode == 'settings' && actPrivilege != 'update') continue
      menuDetail.querySelector('.menu-children-lists:last-child thead tr').innerHTML += `<td>${firstUppercase(actPrivilege)}</td>`
    }
    
    // SET BUTTON ACT COOLUMN BASED ON ACT PRIVILEGES LISTS --ir
    for (child in menuChildren) {
      menuDetail.querySelector('.menu-children-lists:last-child tbody').innerHTML += `<tr data-child="${child}"></tr>` 
      menuDetail.querySelector('.menu-children-lists:last-child tbody tr:last-child').innerHTML += `<td class="col-title-child" data-child="${child}"><button data-menu="${child}" class="child-title">${menuChildren[child].name}</button></td>` 
      for (const actPrivilege of actPrivilegeList) {
        if(menuCode == 'settings' && actPrivilege != 'update') continue
        menuDetail.querySelector('.menu-children-lists:last-child tbody tr:last-child').innerHTML += `<td class="col-act-child" data-child="${child}"><button data-menu="${child}" class="child-act act-button" onclick="updateMenuLevel(this)" data-col="${actPrivilege}" data-status="1">Yes</button></td>` 
      }
    }
  }
  closeLoader()
  menuListsSection.querySelectorAll('.form-input').forEach((field) => { field.onclick = function(){field.closest('.form-input').querySelectorAll('input, select')[0].focus()} })
  menuListsSection.querySelectorAll('.form-input *').forEach((field) => { field.onclick = function(){field.closest('.form-input').querySelectorAll('input, select')[0].focus()} })
  menuListsSection.querySelectorAll('.status-menu').forEach((button) => { button.onclick = function(){ setAndremoveClassActive(button, '.status-menu', '.form-input', false, false ) } })
}

// FUNCTION TO CHANGE PRIVILEGED MENU --ir
function showActPrivilegeMenu(el) {
  openModal(modals[0])
  document.querySelector('#modal-privileged-menu-img').innerHTML = el.querySelector('img').outerHTML
  document.querySelector('#modal-privileged-menu-title').innerHTML = el.querySelector('.menu-info-title').outerHTML
  document.querySelectorAll('.button-privileged').forEach(buttonAct => { 
    buttonAct.classList.remove('deny')
    buttonAct.setAttribute('data-menu', el.getAttribute('data-menu'))
  })
  for (const act in privilegedListsGroup[el.getAttribute('data-menu')]) {
    if(!actPrivilegeList.includes(act.toLowerCase())) continue
    statusAct = privilegedListsGroup[el.getAttribute('data-menu')][act]
    statusText = firstUppercase(act) + " : <b>Yes</b>"
    if(statusAct != 1){
      document.querySelector(`.button-privileged[data-col="${act.toLowerCase()}"]`).classList.add('deny')
      statusText = firstUppercase(act) + " : <b>Yes</b>"
    } 
    document.querySelector(`.button-privileged[data-col="${act.toLowerCase()}"]`).setAttribute('data-status', statusAct)
    document.querySelector(`.button-privileged[data-col="${act.toLowerCase()}"]`).innerHTML = statusText
  }
  // document.querySelector('#modal-privileged-menu-acts').innerHTML = ''
}

// FUNCTION TO UPDATE MENU LEVEL --ir
function updateMenuLevel(el) {
  if(!checkPrivileged('update', 'user_menu')) return false
  
  if(el.getAttribute('data-children') == "no"){
    selectedMenu = el.getAttribute('data-menu')
    selectedMenuText = el.closest('.modal').querySelector('.menu-info-title').innerHTML
  }else{
    selectedMenu = el.closest('tr').getAttribute('data-child')
    selectedMenuText = el.closest('tr').querySelector('.child-title').innerHTML
  }
  groupValue = document.querySelector('.group-button.active').value
  groupValueText = groupLists[groupValue].position_name
  actCol = el.getAttribute('data-col')
  valueBefore = el.getAttribute('data-status')
  allowText = "allow"
  statusText = firstUppercase(actCol) + " : <b>Yes</b>"
  valueAfter = '1'
  if(valueBefore == '1'){
    allowText = "deny"
    valueAfter = '0'
    statusText = firstUppercase(actCol) + " : <b>No</b>"
  }

  infoSwal = `<span>Menu : <b> ${selectedMenuText} </b></span><br> `
  infoSwal += `<span>Authorization : <b> ${firstUppercase(actCol)} </b></span><br> `
  infoSwal += `<span>Group Name : <b> ${groupValueText} </b></span><br> `
  
  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to <b>`+ allowText +`</b> authorization on <b>`+ selectedMenuText +`</b> for group <b>`+ groupValueText +`</b>? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, '+ allowText +' authorization!',
    confirmButtonAriaLabel: 'Update!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'updateMenuLevel',
        type: 'POST',
        dataType: "JSON",
        data: {
          groupValue: groupValue,
          groupValueText: groupValueText,
          menuCode: selectedMenu,
          act: actCol,
          statusValue: valueAfter,
          menuName: selectedMenuText,
          positionName: groupLists[groupValue].position_name
        }, beforeSend: function (){
          openLoader()
        }, success: function (data){
          if(data == "success"){
            Swal.fire({
              title: "Success!",
              html: "<b>" + firstUppercase(actCol) + "</b> authorization on menu <b>" + selectedMenuText + "</b> has been <b>" + allowText + "</b> for <b>" + groupValueText + "</b> group.",
              icon: "success"
            })
            el.setAttribute('data-status', valueAfter)
            if(!el.getAttribute('data-children')){
              el.classList.add('deny') 
              el.innerHTML = 'No'
              if(valueAfter == "1"){
                el.innerHTML = 'Yes'
                el.classList.remove('deny') 
              }
            }else{
              el.setAttribute('data-status', valueAfter)
              el.classList.add('deny')
              if(valueAfter == "1"){
                el.classList.remove('deny')
              }
              document.querySelector(`.button-privileged[data-col="${actCol.toLowerCase()}"]`).innerHTML = statusText
            } 
          }else{
            Swal.fire({
              title: "Failed!",
              html: "Failed to update <b>" + firstUppercase(actCol) + "</b> authorization on menu <b>" + selectedMenuText + "</b> has been <b>" + allowText + "</b> for <b>" + groupValueText + "</b> group.",
              icon: "warning"
            })
          }
        }, complete: function (){
          closeLoader()
          document.querySelector('.group-button.active').click()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to to <b>`+ allowText +`</b> authorization on <b>`+ selectedMenuText +` for group `+ groupValueText +` </b>! <br><br>` + infoSwal
      })
    }
  }) 
}