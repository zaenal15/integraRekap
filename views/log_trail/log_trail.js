// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

setTables = ['table-trail']
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

// document.querySelector('#include-login').onclick = function() { this.classList.toggle('active') }
document.querySelector('#include-login')

todayDate()
dateBefore = new Date()
dateBefore.setMonth(dateBefore.getMonth() - 1)
document.querySelector('#log-trail-start').value = returnSelectedDateConvert(dateBefore, 'ymd')
document.querySelector('#log-trail-end').value = todayYMD
setTrail()

// SET ROOM LISTS --ir
tableTrail = document.querySelector('#table-trail')
tableTrailHead = tableTrail.querySelector('thead')
tableTrailBody = tableTrail.querySelector('tbody')

function setTrail() {
  logStart = document.querySelector('#log-trail-start').value
  logEnd = document.querySelector('#log-trail-end').value
  loadData('loadLogTrail', {dateFilter: 'true', startDate: logStart, endDate: logEnd}).then(function(newData) {
    trailLists = newData
  }).then(() => {
    openLoader()
    tableTrailBody.innerHTML = ``
    $('#table-trail').DataTable().clear().destroy()
  }).then(() => {
    for (key in trailLists) {
      tableTrailBody.innerHTML += `<tr data-trail="${trailLists[key].trail_id}"></tr>`
      tableTrailBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-trail"])
      for (keyValue in trailLists[key]) {
        value = trailLists[key][keyValue]
        if(keyValue == "log_time") value = value.split('T')[1].replace('Z', '')
        text = value
        if(keyValue == "log_date") text = returnSelectedDateConvert(value, 'ymdText')
        tableTrailBody.querySelector('tr:last-child .col-'+ keyValue).setAttribute('data-' + keyValue, value)
        tableTrailBody.querySelector('tr:last-child .col-'+ keyValue).innerHTML += text 
      }
    }
  }).then(() => {
    closeLoader()
    hideColumns(tableTrail, ['log_id', 'position_id', 'position_id'])
    setBasicDataTablePlugin($('#table-trail'), true, -1)
  })
}