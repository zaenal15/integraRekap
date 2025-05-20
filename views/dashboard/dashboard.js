filterPeriodSalesStart = document.querySelector('#start-date-sales')
filterPeriodSalesEnd = document.querySelector('#end-date-sales')
listSalesSection = document.querySelector('#list-sales-section')
todayPeriod = new Date()
startPeriod = new Date()
startPeriod.setDate(todayPeriod.getDate() - 7)
filterPeriodSalesStart.value = returnSelectedDateConvert(startPeriod, 'ymd')
filterPeriodSalesEnd.value = returnSelectedDateConvert(todayPeriod, 'ymd')

document.querySelector('#title-content-header').innerHTML = `Dashboard`

// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

// TOGGLE TO SHOW AND HIDE TOGGLE COUNTER --ir
document.querySelector('#toggle-counter').onclick = function() {
  if(!document.querySelector('.content-wrap').classList.contains('show-table')) setProcess()
  document.querySelector('.content-wrap').classList.toggle('counter')
  this.classList.remove('active')
  this.innerHTML = `<i class="fas fa-clipboard-check"></i> Scan Label`
  if(document.querySelector('.content-wrap').classList.contains('counter')){
    this.classList.add('active')
    this.innerHTML = `<i class="fas fa-eye-slash"></i> Hide Scan Label`
  } 
}

// ADD CONTENT MODAL --ir
modals = ["#modal-retract-process", "#modal-lists-processes", "#modal-print-processes"]
fillModalContent(modals)
modalRetractProcess = document.querySelector(modals[0])
modalViewProcess = document.querySelector(modals[1])
modalPrintProcess = document.querySelector(modals[2])

document.querySelector('#print-work-order').onclick = function() {
  openModal(modals[2])
  document.querySelector('#filter-print-process #date-print-process').innerHTML = `<span>Period Date : ~ <b>${(filterPeriodSalesEnd.value).replaceAll('-', '/')}</b>`
  document.querySelector('#print-process-lists').innerHTML = ``
  document.querySelector('#print-processes-view').innerHTML = ``
  
  for (const keyProcess in keyProcessLists) {
    document.querySelector('#print-process-lists').innerHTML += `<option value="${keyProcess.split("~|~")[0]}">${keyProcess.split("~|~")[0]}-${keyProcess.split("~|~")[1]}</option>`
    document.querySelector('#print-processes-view').innerHTML += `<table data-process="${keyProcess.split("~|~")[0]}" id="table-process-print-${keyProcess.split("~|~")[0]}" class="table-print-process"><thead></thead><tbody></tbody></table>`
    tableProcessPrint = document.querySelector(`#table-process-print-${keyProcess.split("~|~")[0]}`)
    tableProcessPrintHead = tableProcessPrint.querySelector('thead')
    tableProcessPrintBody = tableProcessPrint.querySelector('tbody')
    setBasicDatatable(
      tablesColumn['table-process-print'],
      `table-process-print-${keyProcess.split("~|~")[0]}`,
      true,
      false,
      false,
      false,
      false
    )  
    for (const index in keyProcessLists[keyProcess]) {
      tableProcessPrintBody.innerHTML += `<tr></tr>`
      tableProcessPrintBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-process-print"])
      for (keyValue in keyProcessLists[keyProcess][index]) {
        value = keyProcessLists[keyProcess][index][keyValue]
        // console.log(keyValue, value)
        if(keyValue == "no") value = noOrder
        text = value
        
        if(keyValue.includes('date')){
          value = value.split('T')[0]
          text = value.replaceAll("-", "/")
          if (value == "0001-01-01" && keyValue == "act_date") text = "Not done yet"
        }
        
        if(keyValue == "status_order") text = `<button class="status-col-order" value="${value}">${firstUppercase(value)}</button>`
        if(keyValue == "status_process") text = `<button class="status-col-order" value="${value}">${firstUppercase(value)}</button>`
        if(keyValue == "qty") text = thousandFormat(value)
        if(keyValue == "price" || keyValue == "amount") text = thousandFormat(value, true)
        tableProcessPrintBody.querySelector('tr:last-child .col-'+ keyValue).setAttribute('data-' + keyValue, value)
        tableProcessPrintBody.querySelector('tr:last-child .col-'+ keyValue).innerHTML += text 
      }
    }

    hideColumns(tableProcessPrint, [
      'id',
      'no',
      'act',
      'job_number',
      'drawing_id',
      'new_job_number',
      'drawing_id',
      'status_process',
      'customer_name',
      'process_id',
      'process_alias',
      'remark',
      'order_process',
      'scan_by',
      'status_order',
      'process_name',
      'customer_id',
      'order_date',
      'drawing_count',
      'product_name',
      'product_type',
      'product_type_name',
      'product_size',
      'drawing_image',
      'treatment',
      'special_treatment',
      'material',
      'po_no',
      'price',
      'amount',
      'spec',
      'delivery_date',
      'act_date',
      'qty_process',
      'block',
      'print',
    ])
  }
  setPluginSelect2($('#print-process-lists'))
  document.querySelector('#print-process-lists').onchange = function(){
    document.querySelectorAll('#print-processes-view table').forEach(table => {
      table.classList.remove('show')
    })
    document.querySelector(`#print-processes-view table[data-process="${this.value}"]`).classList.add('show')
    document.querySelector('#title-print-process b').innerHTML = `${ getSelectedOptionText(document.querySelector('#print-process-lists'))}`
  }
  document.querySelector('#print-process-lists').onchange()
}

// LOAD CUSTOMER LISTS --ir
loadData('loadCustomer').done(function (newData) {
  customerLists = newData.data
  document.querySelector('#customer-filter-sales').innerHTML = `<option value="">-- Select Customer --</option>`
  for (const customer in customerLists) {
    document.querySelector('#customer-filter-sales').innerHTML += `<option value="${customer}">${customer} - ${customerLists[customer].customer_alias}</option>`
  }
  setPluginSelect2($('#customer-filter-sales'))
})

// TOGGLE BUTTON FOR SHOW PRODUCT DETAIL --ir
document.querySelector('#show-product-detail-dashboard').onclick = function() {
  document.querySelector('#selected-detail-process').classList.remove('full-detail', 'full-image', 'full-process', 'without-desc')
  currValueLayout = this.value
  if(currValueLayout == "full-process") changeValueLayout = 'without-desc'
  if(currValueLayout == "without-desc") changeValueLayout = 'full-detail'
  if(currValueLayout == "full-detail") changeValueLayout = 'full-image'
  if(currValueLayout == "full-image") changeValueLayout = 'full-process'
  this.value = changeValueLayout
  document.querySelector('#selected-detail-process').classList.add(changeValueLayout)
}

// AUTO FOCUS ON SCAN PROCESS IN MAIN DASHBOARD WHEN OUT OF FOCUS AND IDLE FOR 10 SECOND --ir 
document.getElementById("scan-process").focus()
setInterval(() => {
  if(autoFocusScan > 10 && document.querySelector(".content-wrap").getAttribute('id') == "content-dashboard") document.getElementById("scan-process").focus()
}, 1000);

setTables = ['table-process-order-dashboard']
for(table of setTables) {
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

// EVENT FOR SCAN PROCESS --ir
document.getElementById('scan-process').addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    inputEl = this
    event.preventDefault()
    continueScanProcess(inputEl)
    function continueScanProcess(inputEl) {
      loadData('scanProcess', {scan_process : inputEl.value}).then(function(returnStatus) {
        if(!returnStatus){
          Swal.fire(
            'Hold on!',
            'Code are not detected, please print again or manually set process to complete!',
            'info',
          )
        }else{
          isSuccess = returnStatus.split('-')[1]
          idProcess = returnStatus.split('-')[0]
          statusScan = returnStatus.split('-')[2]
          scanBy = returnStatus.split('-')[3]
  
          if(isSuccess == "success"){
            document.querySelector('#no-process-detected').innerHTML = `<i class="fa fa-check"><i> Scan process successfully!`
            autoSetStatusProcess(idProcess, statusScan, scanBy)
          }else{
            document.querySelector('#no-process-detected').innerHTML = `<i class="fa fa-times"><i> Scan process failed!`
          }
          setTimeout(() => {
            document.querySelector('#no-process-detected').innerHTML = `Scan or type processes code to complete.`
          }, 3000)
        }
        inputEl.value = ``
      })
    }
  }
})

document.getElementById('scan-process').addEventListener("keyup", function(event) {
  inputEl.setAttribute('data-act', 'scan')
  if(!this.value) document.querySelector('#no-process-detected').innerHTML = `Scan or type processes code to complete.`
  else document.querySelector('#no-process-detected').innerHTML = `<div class="loader-gauge"></div><span>Scanning...</span>`
})

// QUICK ACCESS TO ORDER LISTS --ir
document.querySelector('#order-counter-status').onclick = function() { document.querySelector('#menu-sales_lists').click() }

// CHANGE LAYOUT GRID OR TABLE ON SALES LISTS --ir
document.querySelectorAll('.layout-sales').forEach(layout => {
  layout.onclick = function() {
    setAndremoveClassActive(this, '.layout-sales', '#period-sales-section')
    listSalesSection.classList.remove('grid')
    if(this.value == "grid") listSalesSection.classList.add('grid')
  }
})
document.querySelector('#layout-sales-table').click()

// FILTER BY STATUS ORDER --ir
document.querySelector('#set-period-order').onclick = function() { setProcess() }

document.querySelectorAll('.counter-status-box').forEach(box => {
  box.onclick = function () {
    document.querySelectorAll('.counter-status-box').forEach(box => {box.classList.remove('not-active')})
    if(this.classList.contains('active')){
      this.classList.remove('active')
    }else{
      setAndremoveClassActive(this, '.counter-status-box', '#process-counter-activity')
      document.querySelectorAll('.counter-status-box:not(.active)').forEach(box => {box.classList.add('not-active')})
    }
    setProcess()
  }
})

// SET SALES DASHBOARD LISTS --ir
tableProcessDashboard = document.querySelector('#table-process-order-dashboard')
tableProcessDashboardHead = tableProcessDashboard.querySelector('thead')
tableProcessDashboardBody = tableProcessDashboard.querySelector('tbody')

gridSales = document.querySelector('#grid-sales-lists')

totalProcess = 0
function setProcess() {
  document.querySelector('#cancel-sales').click();
  let statOrder = document.querySelectorAll('.counter-status-box.active').length > 0 ? document.querySelector('.counter-status-box.active').getAttribute('data-value') : '';
  let startPeriodOrder = document.querySelector('#start-date-sales').value;
  let endPeriodOrder = document.querySelector('#end-date-sales').value;
  let processFilter = document.querySelector('#process-filter-sales').value;
  let customerFilter = document.querySelector('#customer-filter-sales').value;
  let jobDrawingNumber = document.querySelector('#job-number-filter-sales').value;
  let processCounterPeriod = document.querySelector('#process-counter-period');

  if (processCounterPeriod) {
    processCounterPeriod.innerHTML = `<span>${returnSelectedDateConvert(startPeriodOrder, 'ymdText')} to ${returnSelectedDateConvert(endPeriodOrder, 'ymdText')}</span>`;
  }

  loadData('loadOrderProcess', {
    startPeriod: startPeriodOrder,
    endPeriod: endPeriodOrder,
    process: processFilter,
    customer: customerFilter,
    jobDrawingNumber: jobDrawingNumber,
    byOrderOnly: 'yes',
    querySelected: 'yes',
    // monitoring: 'yes'
  }).then(function(newData) {
    console.log('newData', newData)
    processLists = newData.data;
    console.log('processLists', processLists)
    keyProcessLists = {};
    countProcess = {
      ongoing: 0,
      complete: 0,
      late: 0,
    };
    checkJobNumber = [];
    salesOpen = 0;
    noOrder = 0;
    totalProcess = Object.keys(processLists).length;
  }).then(() => {
    openLoader();
    tableProcessDashboardBody.innerHTML = ``;
    $('#table-process-order-dashboard').DataTable().clear().destroy();
  }).then(() => {
    newRow = ``
    for (key in processLists) {
      let statusProcessValue = processLists[key]['status_process'];
      let statusOrderValue = processLists[key]['status_order'];
      let jobNumber = processLists[key]['job_number'];
      let drawingId = processLists[key]['drawing_id'];
      let processId = processLists[key]['process_id'];
      let idProcess = processLists[key]['id'];
      let processName = processLists[key]['process_name'];
      let processAlias = processLists[key]['process_alias'];
      let processIdName = `${processId}~|~${processAlias}`;
      let processKey = `${drawingId}-${processId}`;
      let customerName = processLists[key]['customer_name'];
      let targetDate = processLists[key]['target_date'];
      countProcess[statusProcessValue] += 1;

      // PUSH LISTS BY KEY PROCESS --ir
      if (statusProcessValue == "ongoing" || targetDate == filterPeriodSalesEnd.value) {
        if (!keyProcessLists[processIdName]) keyProcessLists[processIdName] = [];
        keyProcessLists[processIdName].push(processLists[key]);
      }

      // if(statusProcessValue == "late") countProcess['complete'] += 1
      if (statusOrderValue == "open" && !checkJobNumber.includes(jobNumber)) {
        checkJobNumber.push(jobNumber);
        salesOpen += 1;
      }

      if (statOrder && statOrder != statusProcessValue) continue;

      noOrder++;
      // OLD METHOD --ir
      // let newRow = document.createElement('tr');
      // newRow.setAttribute('data-process-id', idProcess);
      // newRow.setAttribute('data-process', processLists[key].process_id);
      // tableProcessDashboardBody.appendChild(newRow);
      // newRow.innerHTML += setTemplateCols(tablesColumn["table-process-order-dashboard"]);
      // newRow.querySelector('.col-act').innerHTML = `<button class="view-detail button-set" data-drawing-id="${drawingId}" data-process-id="${idProcess}" onclick="viewDetailProcess(this, 'add')"><i class="fa fa-eye"></i></button>`;
      
      // NEW METHOD --ir
      newRow += `<tr data-process-id="${idProcess}" data-process="${processLists[key].process_id}">`
      newRow += `
        <td class="col-act">
          <button class="view-detail button-set" data-drawing-id="${drawingId}" data-process-id="${idProcess}" onclick="viewDetailProcess(this, 'add')"><i class="fa fa-eye"></i></button>
        </td>
      `
      
      for (keyValue in processLists[key]) {
        let classLateDate = `normal`;
        let value = processLists[key][keyValue];
        let text = value;

        if (keyValue == "no") value = noOrder;
        text = value;

        if (keyValue.includes('date')) {
          value = value.split('T')[0];
          text = value.replaceAll("-", "/");
          let checkDateNow = new Date();
          checkDateNow.setDate(checkDateNow.getDate() - 1);
          if (keyValue == "target_date" || keyValue == "due_date_order") {
            if (new Date(value) < checkDateNow) classLateDate = 'late';
          }
          if (value == "0001-01-01" && keyValue == "act_date") text = "Not done yet";
        }

        if (keyValue.includes("status")) {
          let valueConv = "On Process";
          if (text == "complete") valueConv = "Selesai";
          if (keyValue == "status_order") text = `<button class="status-col-order" value="${value}">${firstUppercase(valueConv)}</button>`;
          if (keyValue == "status_process") text = `<button class="status-col-order" value="${value}">${firstUppercase(valueConv)}</button>`;
        }
        if (keyValue == "qty") text = thousandFormat(value);
        if (keyValue == "price" || keyValue == "amount") text = thousandFormat(value, true);
        
        // OLD METHOD --ir
        // if (colElement) {
        //   colElement.setAttribute('data-' + keyValue, value);
        //   colElement.innerHTML += text;
        // }
        // NEW METHOD --ir
        newRow += '<td class="'+ classLateDate +' col-' + keyValue + '" data-' + keyValue + '="' + value + '">'+ text +'</td>'
      }
      newRow += `</tr>`
    }
    tableProcessDashboardBody.innerHTML += newRow
  }).then(() => {
    countProcess['open'] = salesOpen;
    closeLoader();
    hideColumns(tableProcessDashboard, [
      'no',
      'id',
      'job_number',
      'drawing_id',
      'new_job_number',
      'status_process',
      'qty_process',
      'status_order',
    ]);
    disabledDownload = false;
    if (!checkPrivileged('print', 'dashboard', true)) disabledDownload = true;
    setBasicDataTablePlugin($('#table-process-order-dashboard'), false, 10, false);
    let processCounterValue = document.querySelector(`#process-counter-value`);
    if (processCounterValue) processCounterValue.innerHTML = totalProcess;
    for (const statusProcess in countProcess) {
      let activityCounter = document.querySelector(`#activity-counter-${statusProcess}`);
      if (activityCounter) activityCounter.innerHTML = countProcess[statusProcess];
    }
    
    document.querySelector('.content-wrap').classList.add('show-table')
    console.log("keyProcessLists", keyProcessLists)

    // ADDING FUNCTION TO LOAD SALES LISTS AMD COUNTING IT ON MAIN DASHBOARD --ir 
    loadData('loadSales', {startPeriod : startPeriodOrder, endPeriod : endPeriodOrder}).then(function(newData) {
      orderLists = newData.data
      countSales = {
        open: 0,
        production: 0,
        delivery: 0,
      }
      totalSales = Object.keys(orderLists).length
    }).then(() => {
      for (key in orderLists) {
        statusOrderValue = orderLists[key]['status_order']
        countSales[statusOrderValue] += 1
      }
    }).then(() => {
      document.querySelector(`#order-counter-value`).innerHTML = totalSales
  
      for (const statusOrder in countSales) {
        document.querySelector(`#activity-counter-${statusOrder}`).innerHTML = countSales[statusOrder]
      }
    })
  })
}

selectedInfoOrderProduct = {}
// VIEW DRAWING AND PRODUCT INFO BASED ON SELECTED ORDER --ir
function viewDetailProcess(el, act) {
  selectedRow = el.closest('tr')
  selectedBox = el
  // document.querySelector('#lists-processes-view').innerHTML = ``

  // TOGGLE HIDE AND SHOW DETAIL SECTION --ir
  document.querySelector('.content-wrap').classList.remove('open-detail')
  document.querySelector('.content-wrap').classList.remove('full-detail')
  document.querySelector('.content-wrap').classList.remove('full-detail-screen')
  document.querySelector(`#status_order-dashboard`).classList.remove('open', 'ongoing', 'complete')
  
  // HANDLER TO SET SELECTED ROW ON SHOW ORDER PROCESSES DETAIL --ir
  tableProcessDashboard.querySelectorAll('tr').forEach(row => { row.classList.remove('selected')})
  document.querySelectorAll('.button-box-process').forEach(box => { box.classList.remove('selected')})

  document.querySelector('#process-detail-no-data span').innerHTML = `Set filter to show data lists.`
  if(act == "close") return
  document.querySelector('#process-detail-no-data span').innerHTML = `<div class="loader-timer"></div><i>Please wait...</i>`

  selectedDrawingId = el.getAttribute('data-drawing-id')
  // selectedProcessId = el.getAttribute('data-process-id')

  // FILL HEADER INFO BASED ON SELECTED ROW OR BOX --ir
  loadData('loadOrderProcess', {drawing_id : selectedDrawingId, setDrawing: "yes", byOrderOnly: "yes"}).then(function(newData) {
    document.querySelector('.content-wrap').classList.add('open-detail')
    if(selectedRow) selectedRow.classList.add('selected')
    else selectedBox.classList.add('selected')
    orderProcessData = newData.data
    for (const id in orderProcessData) {
      statOrder = ''
      for (const key in orderProcessData[id]) {
        valueRow = orderProcessData[id][key]
        selectedInfoOrderProduct[key] = valueRow
        if(!document.querySelector(`#${key}-dashboard`) && key != "drawing_image") continue

        if(key == "id" || key == "customer_id") continue
        if(key.includes("date") || key == "status_order") selectedInfoOrderProduct[key] = valueRow
        if(key.includes("date")){
          if (valueRow.includes("0001-01-01")) valueRow = "Not done yet"
          else valueRow = returnSelectedDateConvert(valueRow.split("T")[0], 'ymdTextShort')
        } 
        if(key == "status_order"){
          statOrder = valueRow
          document.querySelector(`#${key}-dashboard`).classList.add(valueRow)
        } 
        if(key == "drawing_count"){
          valueRow += ` <i>(${parseInt(orderProcessData[id]['drawing_id'].split("-")[1])} of ${valueRow})</i>` 
        } 
        if(key == "qty") valueRow = thousandFormat(valueRow)
        if(key == "price" || key == "amount") valueRow = thousandFormat(valueRow, true)

        if(key == "drawing_image"){
          document.querySelector('#drawing-section-dashboard img').setAttribute('src', valueRow)
          continue
        }

        document.querySelector(`#${key}-dashboard`).innerHTML = firstUppercase(valueRow)
      }
    }

    // ADDING CLASS BASED ON STATUS ORDER ON DETAIL SECTION --ir
    document.querySelector('#selected-detail-process').classList.remove('open', 'ongoing', 'complete')
    document.querySelector('#selected-detail-process').classList.add(statOrder)
    loadProductOrderDashboard(selectedDrawingId, '#process-lists-box', false)
  })
}

// LOAD PROCESSES DRAWING BASED ON SELECTED ORDER AND DRAWING ID --ir
function loadProductOrderDashboard(drawing_id, section, modalSection) {
  loadData('loadOrderProcess', {drawing_id : drawing_id, byOrderOnly: "yes"}).then(function(newData) {
    dataProcess = newData.data
    if(!modalSection){
      document.querySelector('#process-lists-box-title label').innerHTML = '0 Process Lists'
    }
    if(Object.keys(dataProcess).length > 0) {
      document.querySelector(`${section}`).innerHTML = ``
      if(!modalSection){
        document.querySelector('#process-lists-box-title label').innerHTML = `${Object.keys(dataProcess).length} Processes`
      }

      document.querySelector(`${section}`).innerHTML += `<div class="process-box head"></div>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button class="act-process"> </button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Order</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button style="display: none;">Status</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Code</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Process Name</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Plan</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Actual</button>`
      document.querySelector(`${section} .process-box.head:last-child`).innerHTML += `<button>Scan By</button>`
      for (const key in dataProcess) {
        selectedProcess = ``
        buttonAct = `<abbr title="Copy to Scan"><button data-act="copy" class="copy-retract-process copy-barcode-process"><i class="fa fa-copy"></i></button></abbr>`
          if(dataProcess[key]['status_process'] != "ongoing") buttonAct = `<abbr title="Retract Process"><button data-act="retract" class="copy-retract-process retract-barcode-process"><i class="fa fa-undo"></i></button></abbr>`
          actProcessButton = `
            <div class="basic-flex act-process">
              `+ buttonAct +`
            </div>
          `

        planLate = 'normal'
        targetLate = 'normal'
        checkDateNow = new Date()
        if(new Date(dataProcess[key]['target_date'].split("T")[0]) < checkDateNow) planLate = 'late-date'
        if(new Date(dataProcess[key]['act_date'].split("T")[0]) < checkDateNow) targetLate = 'late-date'
        
        actDateText = dataProcess[key]['act_date'].split("T")[0].replaceAll("-", "/")
        if(dataProcess[key]['act_date'].includes("0001-01-01")) actDateText = "-"
        statusProcess = dataProcess[key]['status_process']
        document.querySelector(`${section}`).innerHTML += `<div data-status="${statusProcess}" data-process-id="${dataProcess[key]['id']}" data-id="${key}" data-order="${dataProcess[key]['order_process']}" class="process-box ${selectedProcess} exist ${statusProcess}"></div>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += actProcessButton
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="order-sort">${dataProcess[key]['order_process']}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="process-status ${statusProcess}">${firstUppercase(dataProcess[key]['status_process'])}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="process-code-text">${dataProcess[key]['process_id']}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="process-name-text">${dataProcess[key]['process_alias']}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="${planLate} process-target-text">${dataProcess[key]['target_date'].split("T")[0].replaceAll("-", "/")}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="${targetLate} process-act-text">${actDateText}</button>`
        document.querySelector(`${section} .process-box:last-child`).innerHTML += `<button class="process-scan-by">${dataProcess[key]['scan_by']}</button>`
      }

      setHandlerRetractCopy()
      checkSkippedProcesses()

      // document.querySelector('#lists-processes-view').innerHTML = document.querySelector('#process-section-dashboard').outerHTML
      // openModal(modals[1])
    }
  })
}

// FUNCTION TO SET FULLSCREEN OR NOT ON DETAIL ORDER AND PRODUCT SECTION --ir
function fullSectionDetailDashboard(act) {
  document.querySelector('#content-dashboard').classList.remove('full-detail-screen')
  if(act == "full") document.querySelector('#content-dashboard').classList.add('full-detail-screen')
}

// COPY BARCODE PROCESS INTO SCAN SECTION OR RECTRACT PROCESS --ir
function setHandlerRetractCopy() {
  document.querySelectorAll('.copy-retract-process').forEach(actProcess => { 
    actProcess.onclick = function() {
      idProcess = actProcess.closest('.process-box').getAttribute('data-process-id')
      processId = actProcess.closest('.process-box').querySelector('.process-code-text').innerHTML
      processOrder = actProcess.closest('.process-box').querySelector('.order-sort').innerHTML
      barcodeProcess = `${selectedInfoOrderProduct['drawing_id']}-${processId}-${processOrder}`
      processName = actProcess.closest('.process-box').querySelector('.process-name-text').innerHTML
      customerName = document.querySelector('#customer_name-dashboard').innerHTML
      poNo = document.querySelector('#po_no-dashboard').innerHTML

      // SHOW COUNTER AND SCAN FIRST --ir
      if(!document.querySelector('#toggle-counter').classList.contains('active')) document.querySelector('#toggle-counter').click()
    
      if(actProcess.getAttribute('data-act') == "copy"){
        document.getElementById("scan-process").value = barcodeProcess
        document.getElementById("scan-process").focus()
        document.getElementById("scan-process").setAttribute('data-act', 'manual')
      }else{
        document.querySelector("#title-retract-process").innerHTML = `${selectedInfoOrderProduct['drawing_id']} - ${processName}`
        retractInfo = {barcode_process : barcodeProcess, process_name: processName, customer_name: customerName, po_no: poNo}
        openModal(modals[0])
      }
    }
  })
}

// FUNCTION TO RETRACT PROCESS --ir
document.querySelector('#retract-process-act').onclick = function(){ retractProcess() }
function retractProcess() {
  reason = document.querySelector('#retract-process-value').value
  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to retract this process?`,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, retract this!',
    confirmButtonAriaLabel: 'Delete!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      loadData('retractProcess', {reason: reason, barcode_process : retractInfo['barcode_process'], process_name: retractInfo['process_name'], process_alias: retractInfo['process_alias'], customer_name: retractInfo['customer_name'], po_no: retractInfo['po_no']}).then(function(isSuccess) {
        if(isSuccess == "success"){
          document.querySelector('#no-process-detected').innerHTML = `<i class="fa fa-check"><i> Retract process successfully!`
          autoSetStatusProcess(idProcess, 'ongoing', '-')
        }else{
          document.querySelector('#no-process-detected').innerHTML = `<i class="fa fa-check"><i> Retract process failed!`
        }
        setTimeout(() => {
          document.querySelector('#no-process-detected').innerHTML = `Scan or type processes code to complete.`
        }, 3000)
        closeModal()
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to retract this process!`
      })
    }
  })
}

// AUTO CHANGE STATUS PROCESS WHEN RETRACT AND SCAN PROCESS --ir
function autoSetStatusProcess(idProcess, statusProceed, scanBy) {
  const scanProcessInput = document.getElementById("scan-process");
  if (scanProcessInput) {
    scanProcessInput.setAttribute('data-act', 'scan');
  }

  const processRow = document.querySelector(`tr[data-process-id="${idProcess}"]`);
  if (processRow) {
    const scanByCol = processRow.querySelector(`.col-scan_by`);
    if (scanByCol) {
      scanByCol.setAttribute(`data-scan_by`, scanBy);
      scanByCol.innerHTML = scanBy;
    }

    const statusProcessCol = processRow.querySelector(`.col-status_process`);
    if (statusProcessCol) {
      statusProcessCol.setAttribute(`data-status_process`, statusProceed);
      const statusColOrder = statusProcessCol.querySelector(`.status-col-order`);
      if (statusColOrder) {
        statusColOrder.value = statusProceed;
        statusColOrder.innerHTML = firstUppercase(statusProceed);
      }
    }

    const actDateCol = processRow.querySelector(`.col-act_date`);
    if (actDateCol) {
      actDateCol.innerHTML = `-`;
      actDateCol.setAttribute(`data-act_date`, "0001-01-01");
    }
  }

  const buttonBox = document.querySelector(`.button-box-process[data-process-id="${idProcess}"]`);
  if (buttonBox) {
    buttonBox.classList.remove('ongoing', 'complete');
    buttonBox.classList.add(statusProceed);
  }

  const activeProcessBox = document.querySelector(`.process-box.active`);
  if (activeProcessBox) {
    activeProcessBox.setAttribute('data-status', statusProceed);

    const processStatus = activeProcessBox.querySelector(`.process-status`);
    if (processStatus) {
      processStatus.classList.remove('ongoing', 'complete');
      processStatus.classList.add(statusProceed);
      processStatus.innerHTML = firstUppercase(statusProceed);
    }

    const processScanBy = activeProcessBox.querySelector(`.process-scan-by`);
    if (processScanBy) {
      processScanBy.innerHTML = scanBy;
    }

    let buttonAct = `<abbr title="Copy to Scan"><button data-act="copy" class="copy-retract-process copy-barcode-process"><i class="fa fa-copy"></i></button></abbr>`;
    if (statusProceed != "ongoing") {
      buttonAct = `<abbr title="Retract Process"><button data-act="retract" class="copy-retract-process retract-barcode-process"><i class="fa fa-undo"></i></button></abbr>`;
    }
    const actProcess = activeProcessBox.querySelector(`.act-process`);
    if (actProcess) {
      actProcess.innerHTML = `${buttonAct}`;
    }

    const processActText = activeProcessBox.querySelector(`.process-act-text`);
    if (processActText) {
      processActText.innerHTML = `-`;
    }
  }

  const statusBefore = selectedInfoOrderProduct['status_process'];
  selectedInfoOrderProduct['status_process'] = statusProceed;

  if (statusProceed != "ongoing") {
    countProcess['ongoing'] = (parseInt(countProcess['ongoing']) - 1);
    countProcess[statusProceed] = (parseInt(countProcess[statusProceed]) + 1);
    const actDate = returnSelectedDateConvert(new Date(), 'ymd').replaceAll('-', '/');
    if (processRow) {
      const actDateCol = processRow.querySelector(`.col-act_date`);
      if (actDateCol) {
        actDateCol.innerHTML = actDate;
        actDateCol.setAttribute(`data-act_date`, actDate);
      }
    }
    if (activeProcessBox) {
      const processActText = activeProcessBox.querySelector(`.process-act-text`);
      if (processActText) {
        processActText.innerHTML = actDate;
      }
    }
  } else {
    countProcess['ongoing'] = (parseInt(countProcess['ongoing']) + 1);
    countProcess[statusBefore] = (parseInt(countProcess[statusBefore]) - 1);
  }

  for (const statusProcess in countProcess) {
    const activityCounter = document.querySelector(`#activity-counter-${statusProcess}`);
    if (activityCounter) {
      activityCounter.innerHTML = `${countProcess[statusProcess]}`;
    }
  }

  setHandlerRetractCopy();
  checkSkippedProcesses();
}


// FUNCTION TO CHECK SKIPPED PROCESS ON PROCESSES LISTS --ir
function checkSkippedProcesses() {
  countProcesses = document.querySelectorAll('.process-box:not(.head):not(.button-set)').length
  processSkipped = false
  statusProcessBefore = ''
  document.querySelectorAll('.process-box:not(.head):not(.button-set)').forEach(row => {
    row.setAttribute('data-skipped', "no")
  })

  processDone = false
  // STARTED FROM THE BOTTOM TO CHECK IF THERE ANY SKIPPED PROCESSES --ir
  for (let index = countProcesses; index > 0; index--) {
    processBox = document.querySelector(`.process-box[data-order="${index}"]`)
    statusProcess = processBox.getAttribute('data-status')
    processSkipped = false
    if(statusProcessBefore == 'complete') processDone = true
    if((statusProcessBefore == 'complete') && statusProcess == "ongoing"){
      processSkipped = true
    }
    if(statusProcessBefore == 'ongoing' && statusProcess == "ongoing" && processDone ) {
      processSkipped = true
    }
    statusProcessBefore = statusProcess
    if(statusProcess == "ongoing" && processSkipped) processBox.setAttribute('data-skipped', "skipped")
  }
}

// PRINT PDF FUNCTION
async function generateWorkOrder(printTypePage){
  openLoader()

  if (printTypePage == 'multipel'){
    processOrderList = document.querySelectorAll('.table-print-process')
  }
  if (printTypePage == 'sigle') {
    processOrderList = document.querySelectorAll('.table-print-process.show')
  }
  wrapPrintTemp = document.getElementById('report-print-temp')
  canvasContent = '<section class="canvas-content report-print" style="height: 1055px; width: 768px; display: grid; grid-template-rows: max-content 1fr; gap:0.5rem; padding: 1rem;"></section>'


  dateProcessPrint = document.getElementById('date-print-process').textContent
  timeProcesaPrint = document.getElementById('runtime-time').getAttribute('data-time')
  timeProcesaPrint = timeProcesaPrint.split(':')
  theadProcessPrint = `
    <tr>
      <th style="text-align: left; width: 100px;">Customer</th>
      <th style="width: 70px;">ID</th>
      <th style="width: 30px;">QTTY</th>
      <th style="text-align: center; width: 50px;">Plan</th>
      <th style="text-align: center; width: 50px;">Delivery</th>
      <th style="text-align: left;">Sisa</th>
    </tr>
  `
  
  wrapPrintTemp.innerHTML = ''
  processOrderList.forEach(process => {
    processId = process.getAttribute('data-process')
    processName = process.querySelector('.col-process_name').textContent
    tbodyContent = process.querySelectorAll('tbody tr')
    wrapContentWo = ` 
    <section class="header-wo-print">
      <section style="margin-bottom: 1rem;">
        <span style="display: block; color: black;font-size: 12px;">This document was printed at ${timeProcesaPrint[0]}:${timeProcesaPrint[1]}</span>
      </section>
      <section style="display: flex; justify-content: space-between; align-items: center;" class="title-header-wo">
        <span class="title-header-text" style="display: block;">Daily Production</span>
        <span style="display: block; padding: 0.5em; border: 1px solid black;">${dateProcessPrint}</span>
      </section>
      <section style="border: 1px solid black; display: grid; margin-top: 1rem; align-items: center;" class="info-header-wo">
        <span style="padding: 0.2rem; font-weight:bold;"> ${processId}-${processName}</span>
      </section>
    </section>
    <section class="tb-content-wo-print"></section>
    `

    wrapPrintTemp.innerHTML += canvasContent
    wrapPrintTemp.querySelector('.canvas-content:last-child').innerHTML += wrapContentWo
    wrapPrintTemp.querySelector('.canvas-content:last-child .tb-content-wo-print').innerHTML +=`<table class="tb-prcess-print" style="width: 100% !important; border-collapse: collapse; margin-top:0.5rem;"> <thead></thead> <tbody></tbody></table>`
    wrapPrintTemp.querySelector('.canvas-content:last-child .tb-prcess-print:last-child thead').innerHTML += theadProcessPrint

    // AAD DATA TABEL WORK ORDER LIST
    tbodyContent.forEach((item, index) => {
      tbTbody = wrapPrintTemp.querySelector('.canvas-content:last-child .tb-prcess-print:last-child tbody')
      jobNo = item.querySelector('.col-job_number').textContent
      drawingId = item.querySelector('.col-drawing_id').textContent
      processId = item.querySelector('.col-process_id').textContent
      processName = item.querySelector('.col-process_name').textContent
      leftOver = item.querySelector('.col-leftover_process').textContent
      qtyWork = item.querySelector('.col-qty').textContent
      targetDate = item.querySelector('.col-target_date').textContent
      dueDate = item.querySelector('.col-due_date_order').textContent
      custName = item.querySelector('.col-customer_alias').textContent

      tbTbody.innerHTML += '<tr></tr>'
      tbTbody.querySelector('tr:last-child').innerHTML +=`
        <td style="border: 0; border-bottom: 1px solid black !important;">${custName}</td>
        <td style="text-align:center; border: 0; border-bottom: 1px solid black !important;">${drawingId}</td>
        <td style="text-align:center; border: 0; border-bottom: 1px solid black !important;">${qtyWork}</td>
        <td style="text-align:center; border: 0; border-bottom: 1px solid black !important;">${targetDate}</td>
        <td style="text-align:center; border: 0; border-bottom: 1px solid black !important;">${dueDate}</td>
        <td style="border: 0; border-bottom: 1px solid black !important;">${leftOver.replaceAll('←','<-')}</td>
      `

      if (index % 40 === 0 && index > 0) {
        wrapPrintTemp.innerHTML += canvasContent
        wrapPrintTemp.querySelector('.canvas-content:last-child').innerHTML += wrapContentWo
        wrapPrintTemp.querySelector('.canvas-content:last-child .tb-content-wo-print:last-child').innerHTML += `<table class="tb-prcess-print" style="width: 100% !important; border-collapse: collapse; margin-top:0.5rem;"> <thead></thead> <tbody></tbody></table>`
        wrapPrintTemp.querySelector('.canvas-content:last-child .tb-prcess-print:last-child thead').innerHTML += theadProcessPrint
      }
    })
  })

  // ADD ID CANVAS PRINT
  wrapPrintTemp.querySelectorAll('.canvas-content').forEach((canvas, index) => {
    no = index + 1
    canvas.setAttribute('id', 'page-canvas' + no + '')
  })

  setTimeout(async() => {
    // STYLE PRINT
    wrapPrintTemp = $('#report-print-temp')
    wrapPrintTemp.find('td,th').css('background', 'white')
    wrapPrintTemp.find('button, span, h2, h3, h4, td, th').css({
      "font-family": "'PT Sans', sans-serif",
      "color": "black",
      "font-size": "12px",
    });
    wrapPrintTemp.find('td').css({
      "background": "transparent",
    })
    wrapPrintTemp.find('th').css({
      "background": "transparent",
      "border": "0",
      "border-bottom": "1px solid black",
      "border-top": "1px solid black",
    })
    wrapPrintTemp.find('.title-header-text').css({
      "font-size": "16px",
      "font-weight": "bold",
    })
    wrapPrintTemp.find('.canvas-content').css({
      "background": "white",
    })
  
    // PRINT PDF CONTENT
    $('.content-wrap .row-plugin').remove();
    $('.content-wrap').append('<div class="row-plugin"> <script src="../../assets/plugins/html2canvas/html2canvas-1-4-1.min.js"></script> <script src="../../assets/plugins/jspdf/jspdf-2-5-1.umd.min.js"></script></div>');
  
    countPage = wrapPrintTemp.find('.canvas-content').length
    canvasName = 'page-canvas'
    canvasType = 'P'
    fileType = 'fileTab'
    fileName = false
    await generateMultipelPDF(canvasName, canvasType, countPage, fileType, fileName)

    // AFTER PRINT
    $('.row-plugin').remove();
    wrapPrintTemp.empty()

    setTimeout(() => {
      closeLoader();
    }, 3000);
  }, 2000);
}



// PRINT EXCEL FUNCTION
// function generateWorkOrder(){
//   // GET CONTENT TABLE
//   tableName = $('.table-print-process.show').attr('id')
//   var tableContent = $("#" + tableName).clone();
//   var wrapTablePrint = $('#wrap-tabel-print table');
//   tableTbody = wrapTablePrint.find('tbody')
//   tableThead = wrapTablePrint.find('thead')

//   wrapTablePrint.find('thead, tbody').empty()

//   wrapTablePrint.find('thead').append('<tr><th colspan="2" class="no-border"></th></tr>');
//   wrapTablePrint.find('thead').append('<tr> <td style="font-size:25px; font-weight:bold;" colspan="7" class="no-border">Today Jobs Report</td> <th colspan="2">' + $('#date-print-process').text() +'</th></tr>');
//   wrapTablePrint.find('thead').append('<tr><th colspan="2" class="no-border"></th></tr>');
//   wrapTablePrint.find('thead').append('<tr> <th colspan="2">Lists Work Orders :</th> <td colspan="7">' + $('#title-print-process b').text() +'</td> <td class="margin-td no-border"></td></tr>');
//   wrapTablePrint.find('thead').append('<tr><th colspan="2" class="no-border"></th></tr>');
//   wrapTablePrint.find('thead').append(tableContent.find('thead').html());
//   wrapTablePrint.find('tbody').append(tableContent.find('tbody').html());
//   wrapTablePrint.find('td[style="display: none;"], th[style="display: none;"]').remove()
//   wrapTablePrint.find('tbody tr, thead tr').prepend('<td class="margin-td no-border"></td>')
//   wrapTablePrint.find('tbody').append('<tr><th colspan="2" class="no-border"></th></tr>');

//   // ADD STYLE CONTENT TABLE
//   wrapTablePrint.find('td, th').css({
//     "vertical-align": "middle",
//   })
//   tableTbody.find('td').css({
//     "font-size": "16px",
//     "text-align": "center",
//   })
//   wrapTablePrint.find('.no-border').css('border', '0')
//   wrapTablePrint.find('.margin-td').css({
//     "width": "20px",
//   })

//   //  EXPORT EXCEL FUNCTION
//   valDate = $('#date-print-process').text().split(':')
//   exportToExcel(wrapTablePrint.attr('id'), `Lists Work Orders ${$('#title-print-process b').text()}(${valDate[1].replaceAll('/','-')} )`)
// }

async function generateMultipelPDF(canvasName, canvasType, countPage, fileType, fileName) {
  return new Promise(async (resolve, reject) => {
    await setTimeout(async () => {
      var jsPDF = window.jspdf.jsPDF;
      const ttlPage = countPage
      if (canvasType == 'L') {
        var PDF_Width = 1084.717
        var PDF_Height = 793.70
        var doc = new jsPDF('L', 'px', [PDF_Width, PDF_Height])
      }
      if (canvasType == 'P') {
        var PDF_Width = 793.70
        var PDF_Height = 1084.717
        var doc = new jsPDF('P', 'px', [PDF_Width, PDF_Height])
      }

      for (let i = 0; i < ttlPage; i++) {
        if (i > 0) {
          doc.addPage();
        }
        const pageElement = await document.getElementById(`${canvasName}${i + 1}`);
        const yPosition = i * PDF_Height;
        if (pageElement) {
          await doc.html(pageElement, {
            x: 0,
            y: yPosition
          });
        }
      }
      if (fileType == 'filePdf') {
        doc.save(fileName + '.pdf');
      }
      if (fileType == 'fileTab') {
        window.open(doc.output('bloburl'));
      }
      resolve('ok');
    }, 2000);
  });
}

function setPeserta() {
  loadData('loadPeserta').then(function (newData) {
    pesertaLists = newData.data; // Ambil data dari JSON response
    console.log('Peserta berhasil di-load:', pesertaLists); // Debugging
  }).catch(function (error) {
    console.error('Error saat memuat data peserta:', error);
  });
}
