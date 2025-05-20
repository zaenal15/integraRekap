const colorThemes = {
  "ahm-clr-wht-glass" : "rgba(255, 255, 255, .8)", 
  "ahm-clr-blk-glass" : "rgba(0, 0, 0, .92)", 
  "ahm-clr-blk-glass-2" : "rgba(10, 14, 28, .92)",
  "ahm-clr-wht-1" : "#FFFFFF", 
  "ahm-clr-wht-2" : "#FAFAFA", 
  "ahm-clr-blk-1" : "#141414", 
  "ahm-clr-blk-2" : "#282828", 
  "ahm-clr-blk-3" : "#4F4F4F", 
  "ahm-clr-red-1" : "#E22435", 
}
let intervalJobNumber = ''

let floorFilterDashboard,
    roomFilterDashboard,
    floorMapDashboard

let newestKursList, countryLists, customerLists, branchLists, processLists, productTypes, materialLists = {}
let intervalRFandomizeDashboard, runTimeDashboard
let autoFocusScan = 0

function clearAllIntevalFunction() {
  clearInterval(intervalJobNumber)
}

// TRIGGER FOR AUTOFOCUS ON SCAN PROCESS IN MAIN DASHBOARD --ir
$(document).mousemove(function (e) { autoFocusScan = 0 })
$(document).keypress(function (e) { autoFocusScan = 0 })
setInterval(() => { autoFocusScan++ }, 1000)

quoStatusLists = {
  'open' : 'New',
  'revision' : 'New Revision',
  'old_version' : 'Old Version',
  'cancel' : 'Cancel',
  'approve' : 'Done',
}

masterRank = [
  { rank: 1, points: 100, keterangan: 'Utama 1' },
  { rank: 2, points: 75, keterangan: 'Utama 2' },
  { rank: 3, points: 50, keterangan: 'Utama 3' },
  { rank: 4, points: 0, keterangan: 'Harapan 1' },
  { rank: 5, points: 0, keterangan: 'Harapan 2' },
  { rank: 6, points: 0, keterangan: 'Harapan 3' },
  { rank: 7, points: 0, keterangan: 'Madya 1' },
  { rank: 8, points: 0, keterangan: 'Madya 2' },
  { rank: 9, points: 0, keterangan: 'Madya 3' },
];

iconCategory = {
  image: 'fas fa-image',
  video: 'fas fa-video',
  audio: 'fas fa-music',
}

const romanNumeralMap = [
  { value: 12, numeral: 'XII' },
  { value: 11, numeral: 'XI' },
  { value: 10, numeral: 'X' },
  { value: 9, numeral: 'IX' },
  { value: 8, numeral: 'VIII' },
  { value: 7, numeral: 'VII' },
  { value: 6, numeral: 'VI' },
  { value: 5, numeral: 'V' },
  { value: 4, numeral: 'IV' },
  { value: 3, numeral: 'III' },
  { value: 2, numeral: 'II' },
  { value: 1, numeral: 'I' }
];

const tablesColumn = {
  "table-quotation": {
    "no": "No",
    "action": "Action",
    "status": "Status",
    "customer_id": "Customer Code",
    "customer_name": "Customer Name",
    "quo_date": "Quotation Date",
    "quo_due_date": "Quotation Due",
    "quo_name": "Quotation Document",
    "quo_no": "Quotation Number",
    "quo_id": "Quotation ID",
    "revision": "Revision",
    "kurs": "Currency",
    "kurs_rate": "Exchange Rate",
    "total_kurs": "Total",
    "total": "Total to IDR",
    "total_price": "Total Price",
  },
  "table-quotation-detail": {
    "no": "No",
    "id": "ID",
    "description": "Product Name",
    "size": "Size",
    "qty": "QTY",
    "unit_price": "Unit Price",
    "quotation_no": "Quotation No",
    "material": "Material",
    "price": "Total Amount",
    "status": "Status",
    "kurs": "Kurs",
    "kurs_rate": "Kurs Rate",
  },
  "table-detail": {
    "no": "No",
    "quo_no": "Quotation Number",
    "quo_name": "Quotation Document",
    "quo_date": "Quotation Date",
    "quo_due_date": "Quotation Due",
    "customer_name": "Send To",
    "revision": "Revision",
    "status": "Status",
    "total": "Total",
  },
  "table-order": {
    "no": "No",
    "action": "Action",
    "view": "View",
    "job_number": "Job Number",
    "order_date": "Order Date",
    "delivery_date": "Delivery Date",
    "due_date": "Due Date",
    "customer": "Send To",
    "quo_no": "Quotation No",
    "po_no": "Po Number",
  },
  "table-order-detail": {
    "no": "No",
    "product_name": "Product Name",
    "product_type": "Product Type",
    "product_size": "Product Size",
    "qty": "Quantity",
    "price": "Price",
    "spec": "Specification",
    "treatment": "Treatment",
    "special_treatment": "Special Treatment",
    "material": "Material",
    "job_number": "Job Number",
  },
  "table-print-excel": {
    "no": "No",
    "quotation_name": "Quotation Name",
    "customer_id": "Customer Code",
    "customer_name": "Customer Name",
    "description": "Description",
    "size_length": "Size",
    "size_wide": "Size",
    "qty": "Quantity",
    "unit_price": "Unit Price",
    "price": "Price",
    "process_date": "Tanggal Proses",
    "description_result": "Description",
    "result": "Result",
  },
  "table-print-excel-po": {
    "no": "No",
    "order_date": "Order Date",
    "job_number": "Job Number",
    "customer_id": "Customer Id",
    "customer_name": "Customer Name",
    "product_name": "Product Name",
    "size_length": "Size",
    "size_wide": "Size",
    "qty": "Quantity",
    "price": "Unit Price",
    "tll_price": "Price",
    "due_date": "Process Date",
    "product_type": "Type",
    "po_no": "Po Number",
  },
  "table-trail": {
    "no": "No",
    "log_id": "Log ID",
    "log_date": "Date",
    "log_time": "Time",
    "username": "Username",
    "name": "Name",
    "position_id": "Position Id",
    "position_name": "Position Name",
    "menu": "Menu",
    "activity": "Activity",
    "activity_desc": "Activity Desc",
    "info": "info",
  },
  "table-process-order-dashboard": {
    "no": "No",
    "id": "Id",
    "act": "View",
    "status_process": "Status Process",
    "customer_alias": "Customer",
    "reprocess_id": "Id",
    "process_id": "Process",
    "process_alias": "Process Name",
    "qty": "Qty",
    "target_date": "Plan",
    "due_date_order": "Plan Delivery",
    "leftover_process": "Sisa",
    "job_number": "Job Number",
    "drawing_id": "Drawing Id",
    "new_job_number": "Job Number",
    "qty_process": "Qty Process",
    "status_order": "Status Order",
  },
  "table-process-print": {
    "no": "No",
    "id": "Id",
    "act": "View",
    "status_process": "Status Process",
    "job_number": "Job Number",
    "drawing_id": "ID",
    "process_id": "Process",
    "new_job_number": "Job Number",
    "reprocess_id": "ID",
    "customer_alias": "Customer",
    "process_name": "Process Name",
    "process_alias": "Process Name",
    "qty": "QTTY",
    "target_date": "Plan",
    "due_date_order": "Plan Delivery",
    "leftover_process": "Sisa",
    "act_date": "Actual Date Process",
    "customer_name": "Customer",
    "remark": "Remark",
    "order_process": "order_process",
    "scan_by": "Scan By",
    "status_order": "Status Order",
    "customer_id": "Customer Id",
    "order_date": "Order Date",
    "drawing_count": "QTTY Drawing",
    "product_name": "Product",
    "product_type": "Type",
    "product_type_name": "Type Name",
    "product_size": "Size",
    "drawing_image": "Drawing Image",
    "treatment": "Treatment",
    "special_treatment": "Special Treatment",
    "material": "Material",
    "po_no": "PO No / Job Name",
    "price": "Price",
    "amount": "Amount",
    "spec": "Marking",
    "delivery_date": "Actual Delivery",
    "qty_process": "Qty Process",
    "block": "Block",
    "print": "Print",
    "reprocess_no": "reprocess_no",
  },
  "table-sales": {
    "no": "No",
    "id": "Id",
    "view": "View",
    "status_order": "Status Order",
    "customer_alias": "Customer",
    "job_number": "Job Number",
    "drawing_id": "ID",
    "new_job_number": "Job Number",
    "reprocess_id": "ID",
    "qty": "Qty",
    "order_date": "Order Date",
    "due_date": "Plan Delivery",
    "delivery_date": "Delivery Date",
    "customer_name": "Customer",
    "po_no": "Po No",
    "product_name": "Product",
    "drawing_count": "Count",
    "product_size": "Size",
  },
  "table-sales-detail": {
    "no": "No",
    "id": "Id",
    "view": "View",
    "status_order": "Status Order",
    "customer_alias": "Customer",
    "job_number": "Job Number",
    "new_job_number": "Job Number",
    "reprocess_id": "ID",
    "drawing_id": "ID",
    "qty": "Qty",
    "due_date": "Plan Delivery",
    "customer_id": "Customer Id",
    "customer_name": "Customer",
    "po_no": "PO No / Job Name",
    "product_name": "Product",
    "price": "Price",
    "amount": "Amount",
    "delivery_date": "Actual Delivery",
    "product_type": "Type",
    "product_type_name": "Type Name",
    "product_size": "Size",
    "treatment": "Treatment",
    "special_treatment": "Special Treatment",
    "material": "Material",
    "spec": "Marking",
    "drawing_count": "QTTY Drawing",
    "drawing_image": "Drawing Image",
    "reprocess_no": "No Reprocess",
    "reprocess_remark": "Reprocess Remark",
    "reprocess": "Reprocess",
  },
  "table-shipping-detail": {
    "no": "No",
    "id": "Id",
    "view": "View",
    "status_order": "Status Order",
    "customer_alias": "Customer",
    "job_number": "Job Number",
    "drawing_id": "ID",
    "new_job_number": "Job Number",
    "reprocess_id": "ID",
    "qty": "Qty",
    "order_date": "Order Date",
    "due_date": "Plan Delivery",
    "delivery_date": "Actual Delivery",
    "customer_id": "Customer Id",
    "customer_name": "Customer",
    "po_no": "PO No / Job Name",
    "product_name": "Product",
    "price": "Price",
    "amount": "Amount",
    "product_type": "Type",
    "product_type_name": "Type Name",
    "product_size": "Size",
    "treatment": "Treatment",
    "special_treatment": "Special Treatment",
    "material": "Material",
    "spec": "Marking",
    "drawing_count": "QTTY Drawing",
    "drawing_image": "Drawing Image",
    "reprocess_no": "No Reprocess",
    "reprocess_remark": "Reprocess Remark",
    "reprocess": "Reprocess",
  },
  "table-shipping": {
    "no": "No",
    "id": "Id",
    "view": "View",
    "status_order": "Status Order",
    "customer_alias": "Customer",
    "job_number": "Job Number",
    "drawing_id": "ID",
    "new_job_number": "Job Number",
    "reprocess_id": "ID",
    "qty": "Qty",
    "order_date": "Order Date",
    "due_date": "Plan Delivery",
    "delivery_date": "Actual Delivery",
    "customer_name": "Customer",
    "po_no": "PO No / Job Name",
    "product_name": "Product",
    "drawing_count": "QTTY Drawing",
    "product_size": "Size",
  },
  'table-category': {
    no: 'No',
    category_id: 'Category ID',
    category_name: 'Category Name',
    type_file: 'Type File',
    icon: 'Icon',
    last_update: 'Last Update',
    last_update_by: 'Last Update By',
    action: 'Action',
  },
  'table-kurs': {
    no: 'No',
    id: 'ID',
    country_name: 'Country',
    country_curr: 'Country',
    kurs: 'Currency',
    country_curr_symbol: 'Symbol',
    country_curr_name: 'Country Currency',
    kurs_before: 'Exchange Rate Before',
    kurs_after: 'Exchange Rate After',
    kurs_update: 'Exchange Rate Update',
    kurs_update_by: 'Exchange Rate Update By',
  },
  'table-customer': {
    no: 'No',
    customer_id: 'Customer Code',
    customer_name: 'Customer',
    customer_type: 'Customer Type',
    customer_alias: 'Customer Alias',
    country_code: 'Country Code',
    country_name: 'Country Name',
    customer_address: 'Customer Address',
    customer_npwp: 'Customer Npwp Number',
    customer_npwp16: 'Customer Npwp16',
    customer_telp: 'Customer Telp',
    customer_fax: 'Customer fax',
    customer_website: 'Customer Website',
    customer_att: 'PIC Customer',
    customer_email: 'Email',
  },
  'table-process': {
    no: 'No',
    process_id: 'Code',
    process_name: 'Process Name',
    process_alias: 'Process Alias',
  },
  'table-pangkalan': {
    no: 'No',
    id: 'ID',
    nama_pangkalan: 'Pangkalan',
  },
  'table-mata-lomba': {
    no: 'No',
    lomba_id: 'ID',
    nama_lomba: 'Nama Lomba',
    jumlah_juri: 'Total Juri',
    kategori_id: 'Kategori ID',
    nama_kategori: 'Nama Kategori'
  }

}


function getRomanNumeral(value) {
  const foundItem = romanNumeralMap.find(item => item.value === value)
  return foundItem ? foundItem.numeral : null
}

// START RUNNING TIME --ir
runTimeDashboard = setInterval(function () {
  todayDate()
  $('#runtime-date span:first-child').html(dayNamesFull[today.getDay()]).attr('data-day', today.getDay())
  $('#runtime-date span:last-child').html(todayDateText.split(", ")[1]).attr('data-date', todayYMD)
  $('#runtime-time').html(`<i class="far fa-clock"></i> ${todayTime}`).attr('data-time', todayTime)
}, 1000)

// CLEAR ALL INTERVAL ON DASHBOARD --ir
function clearIntervalAndFeatureDashboard() {
  // if(document.querySelector('#slideshow-opt').classList.contains('active')) showHideSlideshowControls(document.querySelector('#slideshow-opt'), true) 
}

// FUNCTION TO SET SPEED SLIDESHOW ON DASHBOARD --ie
function setSpeedSlideShow(el) {
  if(document.querySelectorAll('#menu-dashboard.active').length <= 0) return false
  if(document.querySelectorAll('.slideshow-opt.active').length <= 0) document.querySelector('.slideshow-opt:first-child').classList.add('active') 
  slideshowOpt = document.querySelector('.slideshow-opt.active').getAttribute('data-slideshow')

  setAndremoveClassActive(el, '.speed-control', '#speed-control-section', false, false)
  document.querySelector('#content-dashboard').classList.remove('slow-speed' ,'normal-speed' ,'high-speed')
  document.querySelectorAll('.progress-bar-slideshow .progress-bar').forEach(progressBar => {
    progressBar.parentElement.classList.add('hide')
    progressBar.classList.remove('active' ,'slow-speed' ,'normal-speed' ,'high-speed')
    progressBar.style.marginLeft = '-100%'
  }) 
  
  clearInterval(fadeSlideshowInterval)
  if(slideshowOpt == "carousel"){
    document.querySelectorAll('.page-control').forEach(page => { page.classList.remove('active') })
    document.querySelector('#content-dashboard').classList.add(el.getAttribute('data-speed') + '-speed')
  }else{
    document.querySelectorAll('.progress-bar-slideshow .progress-bar').forEach(progressBar => {
      progressBar.classList.add('active' ,`${el.getAttribute('data-speed')}-speed`)
      progressBar.style.marginLeft = '-100%'
    }) 
    
    fadeSlideshowInterval = setInterval(() => {
      activePage = document.querySelector('.page-control.active').nextElementSibling
      if(activePage) activePage.click()
      else document.querySelector('.page-control:first-child').click()
      document.querySelectorAll(`.progress-bar-slideshow .progress-bar`).forEach(progressBar => {
        progressBar.parentElement.classList.add('hide')
        if(progressBar.parentElement.getAttribute('data-page') == `${document.querySelector('.page-control.active').getAttribute('id')}`) progressBar.parentElement.classList.remove('hide')
        progressBar.style.marginLeft = '-100%'
      })
    }, progressBarSpeed[el.getAttribute('data-speed')])
  }
  
  document.querySelector('#play-slideshow-control').classList.add('active')
  document.querySelector('#stop-slideshow-control').classList.remove('active')
}

function openJemari() {
  window.location = `${window.location.protocol}//${window.location.hostname}:1178/`
}

// FUNCTION TO SET PAGE SLIDESHOW ON DASHBOARD --ie
function setPageSlideShow(el) {
  if(document.querySelectorAll('#menu-dashboard.active').length <= 0) return false
  if(document.querySelectorAll('.slideshow-opt.active').length <= 0) document.querySelector('.slideshow-opt:first-child').classList.add('active') 

  setAndremoveClassActive(el, '.page-control', '#page-control-section', false, false)
  slideshowOpt = document.querySelector('.slideshow-opt.active').getAttribute('data-slideshow')
  document.querySelector('#content-dashboard').classList.remove('slow-speed' ,'normal-speed' ,'high-speed')
  document.querySelector('#content-dashboard').style.left = el.getAttribute('data-page')
  if(slideshowOpt == "carousel"){
    document.querySelector('#play-slideshow-control').classList.remove('active')
    document.querySelector('#stop-slideshow-control').classList.add('active')
    document.querySelectorAll('.speed-control').forEach(speed => { speed.classList.remove('active') })
  } 
}

// FUNCTION TO STOP OR PLAY SLIDESHOW DASHBOARD --ir
function setSlideshowPlayer(el, value) {
  if(document.querySelectorAll('#menu-dashboard.active').length <= 0) return false

  setAndremoveClassActive(el, '.slideshow-control', '#slideshow-control-section', false, false)
  if(value == "play") document.querySelector('.speed-control:nth-child(2)').click()
  if(value == "stop") document.querySelector('.page-control:nth-child(1)').click()
}

// FUNCTION TO CHOOSE SLIDESHOW OPTIONS --ir
function setSlideshowOpt(el, value) {
  if(document.querySelectorAll('#menu-dashboard.active').length <= 0) return false
  setAndremoveClassActive(el, '.slideshow-opt', '#slideshow-control-opt', false, false)
  // document.querySelectorAll('.progress-bar-slideshow').forEach(progressBar => { progressBar.classList.add('hide') }) 
  document.querySelector('#content-dashboard').classList.remove('fade-transition') 
  // if(value == "carousel")
  if(value == "fade") {
    document.querySelector('#content-dashboard').classList.remove('slow-speed' ,'normal-speed' ,'high-speed')
    document.querySelector('#content-dashboard').classList.add('fade-transition') 
    document.querySelector('.page-control:nth-child(1)').click()
    document.querySelector('.speed-control:nth-child(2)').click()
    // document.querySelectorAll('.progress-bar-slideshow').forEach(progressBar => { progressBar.classList.remove('hide') }) 
  } else document.querySelector('.speed-control:nth-child(2)').click()
}

// SHOW OR HIDE SLIDE SHOW CONTROLS PANEL --ir
function showHideSlideshowControls(el, swith) {
  if(!document.querySelector('#menu-dashboard').classList.contains('active') && !swith){
    Swal.fire(
      'Hold on!',
      'Slideshow control panel can be open on dashboard menu only.',
      'info',
    )
    return false
  }
  
  el.classList.toggle('active')
  slideshowControlPanel.style.left = '-100vh'
  slideshowControlPanel.style.top = slideshowControlPanel.getAttribute('data-top') + "px"
  slideshowControlPanel.style.transition = 'all var(--speed-faster) ease-in-out'
  if(el.classList.contains('active')){
    slideshowControlPanel.style.left = slideshowControlPanel.getAttribute('data-left') + "px"
    slideshowControlPanel.style.top = slideshowControlPanel.getAttribute('data-top') + "px"
    setTimeout(() => {
      slideshowControlPanel.style.transition = 'unset'
    }, 1000);
  } 
}

// FUNCTION TO CHANGE DEFAULT SLIDESHOW (USER SETTINGS) --ir
function changeDefaultSlideshow(el, value) {
  setAndremoveClassActive(el, '.opt-slideshow-setting', '#opt-slideshow-opts')
  
  slideshowBefore = selectedSlideshow 
  selectedSlideshow = value
  
  textTitle = "Default slideshow"
  textQ = "default slideshow on dashboard menu"

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 
  
  if(!el.value){
    el.value = slideshowBefore
    return false
  } 

  infoSwal = `<span>${textTitle} Before : <b> ${firstUppercase(slideshowBefore)}</b></span><br> `
  infoSwal += `<span>${textTitle} After : <b> ${firstUppercase(selectedSlideshow)}</b></span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to change ${textQ}? <br><br> ${infoSwal}` ,
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
        url: 'updateDefaultSlideshow',
        method: 'POST',
        dataType: 'JSON',
        data: {
          user_id: userInfo.Id,
          username: userInfo.Username,
          slideshowBefore: slideshowBefore,
          selectedSlideshow: selectedSlideshow,
          textQ: textQ,
        },
        beforeSend: function () {
          openLoader()
        }, success: function (data) {
          if(data == "success"){
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully to change ${textQ}! <br><br> ${infoSwal}`,
            })
            selectedSlideshow = value
            settingLists[0].selected_slideshow = value
          }else{
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to change ${textQ}! <br><br> ${infoSwal}`,
            })
            el.value = slideshowBefore
          }
        }, complete: function () {
          closeLoader()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to change ${textQ}! <br><br> ${infoSwal}` ,
      })
    }
  })
  
}

// FUNCTION TO CHANGE DEFAULT SLIDESHOW (USER SETTINGS) --ir
function changeDefaultSlideshow(el, value) {
  setAndremoveClassActive(el, '.opt-slideshow-setting', '#opt-slideshow-opts')
  
  slideshowBefore = selectedSlideshow 
  selectedSlideshow = value
  
  textTitle = "Default slideshow"
  textQ = "default slideshow on dashboard menu"

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 
  
  if(!el.value){
    el.value = slideshowBefore
    return false
  } 

  infoSwal = `<span>${textTitle} Before : <b> ${firstUppercase(slideshowBefore)}</b></span><br> `
  infoSwal += `<span>${textTitle} After : <b> ${firstUppercase(selectedSlideshow)}</b></span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to change ${textQ}? <br><br> ${infoSwal}` ,
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
        url: 'updateDefaultSlideshow',
        method: 'POST',
        dataType: 'JSON',
        data: {
          user_id: userInfo.Id,
          username: userInfo.Username,
          slideshowBefore: slideshowBefore,
          selectedSlideshow: selectedSlideshow,
          textQ: textQ,
        },
        beforeSend: function () {
          openLoader()
        }, success: function (data) {
          if(data == "success"){
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully to change ${textQ}! <br><br> ${infoSwal}`,
            })
            selectedSlideshow = value
            settingLists[0].selected_slideshow = value
          }else{
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to change ${textQ}! <br><br> ${infoSwal}`,
            })
            el.value = slideshowBefore
          }
        }, complete: function () {
          closeLoader()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to change ${textQ}! <br><br> ${infoSwal}` ,
      })
    }
  })
  
}

// FUNCTION TO CHANGE RUNNING TEXT ON MAIN DASHBOARD --ir
function changeRunningText(el) {
  runningTextBefore = runningTextDashboard 
  runningTextUpdate = el.parentElement.querySelector('textarea').value
  
  textTitle = "Running text"
  textQ = "main dashboard running text"

  // if(!checkPrivileged('update', 'settings_alarm')){
  //   el.value = selectedTimerAct
  //   return false
  // } 
  
  if(!el.parentElement.querySelector('textarea').value){
    el.parentElement.querySelector('textarea').value = runningTextBefore
    return false
  } 

  infoSwal = `<span>${textTitle} Before : <br> <b> ${firstUppercase(runningTextBefore)}</b></span><br><br> `
  infoSwal += `<span>${textTitle} After : <br> <b> ${firstUppercase(runningTextUpdate)}</b></span><br> `

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to change ${textQ}? <br><br> ${infoSwal}` ,
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
        url: 'updateMainRunningText',
        method: 'POST',
        dataType: 'JSON',
        data: {
          runningTextBefore: runningTextBefore,
          runningTextUpdate: runningTextUpdate,
          textQ: textQ,
        },
        beforeSend: function () {
          openLoader()
        }, success: function (data) {
          if(data == "success"){
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully to change ${textQ}! <br><br> ${infoSwal}`,
            })
            runningTextDashboard = runningTextUpdate
            settingLists[0].running_text = runningTextUpdate
            document.querySelector('#broadcast-section').innerHTML = `<i class="fas fa-bullhorn"></i>    ${runningTextDashboard}`
          }else{
            Swal.fire({
              title: '<strong>Failed</strong>',
              icon: 'warning',
              html: `Failed to change ${textQ}! <br><br> ${infoSwal}`,
            })
            el.parentElement.querySelector('textarea').value = runningTextBefore
          }
        }, complete: function () {
          closeLoader()
          setMainRunningText()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to change ${textQ}! <br><br> ${infoSwal}` ,
      })
    }
  })
}

//DRAGG & DROP USING ELMENN FOLDER
function dragDropElementFolder(){
  const boxFolder = document.querySelectorAll('.box-folder')
  
  boxFolder.forEach(boxFolderSection =>{
    boxFolderSection.addEventListener("dragstart", () => {
      boxFolderSection.classList.add("dragging")
    })
    boxFolderSection.addEventListener("dragover", (e) =>{
      e.preventDefault();
      boxFolderSection.classList.add("hovered")
    })
    boxFolderSection.addEventListener("dragleave", () =>{
      boxFolderSection.classList.remove("hovered")
    })
    boxFolderSection.addEventListener("drop", () =>{
      console.log(boxFolderSection)
      document.querySelector('.box-folder.dragging').remove()
    })
    boxFolderSection.addEventListener("dragend", () =>{
      boxFolderSection.classList.remove("dragging")
    })
  })
}

// SET ZOOM LEVEL --ir
let zoomLevel = 100
let zoomLevelFloor = 100

function setZoomBody(type) {
  $('#zoom-in, #zoom-out, #zoom-floor-out, #zoom-floor-in').prop('disabled', false)
  console.log('zoomLevelFloor',zoomLevelFloor)
  
  if(type == "zoom-out" || type == "zoom-in"){
    if (type === "zoom-in") {
      zoomLevel += 7.5;
    } else if (type === "zoom-out") {
      zoomLevel -= 7.5;
    }

    zoomLevel = Math.min(100, Math.max(50, zoomLevel));

    $('#zoom-in').prop('disabled', zoomLevel >= 100);
    $('#zoom-out').prop('disabled', zoomLevel <= 50);

    $('#zoom-note').text(zoomLevel + '%');
    setTimeout(function () {
      $('#zoom-note').text('');
    }, 1000);

    var zoomValue = zoomLevel / 100;
    $('.content-wrap section:first, #doHeader, #title-main-menu, #nav-sub-menu, #nav-main-menu, #mini-logo, #tooltip-sidebar')
      .css({
        'zoom': zoomValue,
        'transform': 'scale(' + zoomValue + ')',
        '-moz-transform': 'scale(' + zoomValue + ')'
      });

  }else{
    // SET ZOOM FLOOR MAP
    if (type == "zoom-floor-in"){
      zoomLevelFloor += 50
    }else if (type == "zoom-floor-out"){
      if(zoomLevelFloor == 100) return false
      zoomLevelFloor -= 50
    }

    if (zoomLevelFloor < 150 && zoomLevelFloor > 50) {
      zoomLevelFloor = 100;
      $('#zoom-floor-out').prop('disabled', true);
    } else if (zoomLevelFloor > 250) {
      zoomLevelFloor = 300;
      $('#zoom-floor-in').prop('disabled', true);
    }

    $('#zoom-note').text(zoomLevelFloor + '%') 
    setTimeout(function () {
      $('#zoom-note').text('')
    }, 1000)
    
    const zoomValue = zoomLevelFloor / 100;
    $('#wrap-floor-dashboard').css({
      'zoom': zoomLevelFloor + '%',
      '-moz-transform': `scale(${zoomValue}, ${zoomValue})`
    });

    $('.add-zoom-content').css({
      'scale': `${zoomLevelFloor}%`,
      'transform-origin': '0 0'
    });
  }
}

function sidebarMobileMenu() {
  sidebarMenu = document.getElementById('mainSidebar')
  sidebarMenu.classList.toggle('active')
}