// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

setTables = ['table-customer']
for(table of setTables) {
  setBasicDatatable(
    tablesColumn[table],
    table,
    false,
    false,
    false,
    false,
    false
  )
}
// ADD CONTENT MODAL --ir
modals = ["#modal-update-customer"]
fillModalContent(modals)
modalCustomer = document.querySelector(modals[0])

setCustomer('')
setZoomContent()

// SET COUNTRY LISTS AS AN OPTION ON FORM CUSTOMER --ir
for (const key in countryLists) {
  document.querySelector('#customer-country-field').innerHTML += `<option value="${key}">(${key}) ${countryLists[key].country_name}</option>`
}

// CHANGE LAYOUT GRID OR TABLE ON CUSTOMER LISTS --ir
document.querySelectorAll('.layout-customer').forEach(layout => {
  layout.onclick = function() {
    setAndremoveClassActive(this, '.layout-customer', '#table-customer-crud')
    customerLayout.classList.remove('grid')
    if(this.value == "grid") customerLayout.classList.add('grid')
  }
})
document.querySelector('#layout-customer-grid').click()

// SET AREA LISTS --ir
tableCustomer = document.querySelector('#table-customer')
gridCustomer = document.querySelector('#grid-customer')
tableCustomerHead = tableCustomer.querySelector('thead')
tableCustomerBody = tableCustomer.querySelector('tbody')

function setCustomer() {
  loadData('loadCustomer').then(function(newData) {
    customerLists = newData.data
  }).then(() => {
    openLoader()
    tableCustomerBody.innerHTML = ``
    gridCustomer.innerHTML = ``
    $('#table-customer').DataTable().clear().destroy()
  }).then(() => {
    for (key in customerLists) {
      tableCustomerBody.innerHTML += `<tr data-customer="${customerLists[key].customer_id}"></tr>`
      tableCustomerBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-customer"])
      gridCustomer.innerHTML += `
        <button class="customer-box">
          <i class="box-icon fa fa-building"></i>
          <span class="box-customer-name"> ${customerLists[key]['customer_name']}</span>
          <span class="box-customer-type"> Type : ${firstUppercase(customerLists[key]['customer_type'])}</span>
          <span class="box-customer-alias"> Alias : <b>( ${customerLists[key]['customer_id']} )</b> ${firstUppercase(customerLists[key]['customer_alias'])}</span>
          <span class="box-country-name"> Country : ${firstUppercase(customerLists[key]['country_name'])}</span>
        </button>
      `
      for (keyValue in customerLists[key]) {
        value = customerLists[key][keyValue]
        text = firstUppercase(value)
        tableCustomerBody.querySelector('tr:last-child .col-'+ keyValue).setAttribute('data-' + keyValue, value)
        tableCustomerBody.querySelector('tr:last-child .col-'+ keyValue).innerHTML += text 
      }
    }
  }).then(() => {
    closeLoader()
    hideColumns(tableCustomer, ['id'])
    disabledDownload = false
    if(!checkPrivileged('print', 'mst_customer', true)) disabledDownload = true 
    setBasicDataTablePlugin($('#table-customer'), true, 100, disabledDownload)
  })
}

// DELETE AREA ID --ir
function deleteCustomer() {
  if(!checkPrivileged('delete', 'mst_customer')) return false

  selectedRow = document.querySelector('#table-customer tr.selected')
  if(!selectedRow){
    Swal.fire(
      'Hold on!',
      'Please select customer first!',
      'info',
    )
    return false
  }
  
  id =  selectedRow.querySelector('.col-customer_id').getAttribute('data-customer_id')
  customerName =  selectedRow.querySelector('.col-customer_name').getAttribute('data-customer_name')
  customerType =  selectedRow.querySelector('.col-customer_type').getAttribute('data-customer_type')
  customerAlias =  selectedRow.querySelector('.col-customer_alias').getAttribute('data-customer_alias')
  countryCode =  selectedRow.querySelector('.col-country_name').getAttribute('data-country_name')
  addressName =  selectedRow.querySelector('.col-customer_address').getAttribute('data-customer_address')
  numberPhone =  selectedRow.querySelector('.col-customer_telp').getAttribute('col-customer_telp')
  numberFax =  selectedRow.querySelector('.col-customer_fax').getAttribute('col-customer_fax')
  npwpNumber =  selectedRow.querySelector('.col-customer_npwp').getAttribute('data-customer_npwp')
  customerNpwp =  selectedRow.querySelector('.col-customer_npwp16').getAttribute('data-customer_npwp16')
  customerWebsite =  selectedRow.querySelector('.col-customer_website').getAttribute('data-customer_website')
  customerPic =  selectedRow.querySelector('.col-customer_att').getAttribute('data-customer_att')
  email =  selectedRow.querySelector('.col-customer_email').getAttribute('data-customer_email')
  infoSwal = `<span>Customer ID : <b> ${id} </b></span><br> `
  infoSwal += `<span>Customer Name : <b> ${customerName} </b></span><br> `
  infoSwal += `<span>Customer Alias : <b> ${customerAlias} </b></span><br> `
  infoSwal += `<span>Customer Type : <b> ${firstUppercase(customerType)} </b></span><br> `
  infoSwal += `<span>Customer Country : <b> ${countryCode} </b></span>`
  infoSwal += `<span>Address Name : <b> ${addressName} </b></span>`
  infoSwal += `<span>Number Phone : <b> ${numberPhone} </b></span>`
  infoSwal += `<span>Number Fax : <b> ${numberFax} </b></span>`
  infoSwal += `<span>Npwp Number : <b> ${(npwpNumber)} </b></span>`
  infoSwal += `<span>Customer Npwp16 : <b> ${(customerNpwp)} </b></span>`
  infoSwal += `<span>Website : <b> ${(customerWebsite)} </b></span>`
  infoSwal += `<span>PIC Customer : <b> ${(customerPic)} </b></span>`
  infoSwal += `<span>Email : <b> ${(email)} </b></span>`
  
  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to delete this customer?  <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, delete this!',
    confirmButtonAriaLabel: 'Delete!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'deleteCustomer',
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          customerName: customerName,
        }, beforeSend: function (){
          openLoader()
        }, success: function (data){
          if(data == "success"){
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully delete this customer! <br><br>` + infoSwal
            })
          }else{
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to delete this customer! <br><br>` + infoSwal
            })
          }
        }, complete: function (){
          setCustomer('')
          closeLoader()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to delete this customer! <br><br>` + infoSwal
      })
    }
  })
} 

// TRIGGER MODAL AREA ID --ir
function updateCustomerModal(value) {
  if(!checkPrivileged('update', 'mst_customer')) return false

  selectedRow = document.querySelector('#table-customer tr.selected')
  if(!selectedRow && value == "update"){
    Swal.fire(
      'Hold on!',
      'Please select customer first!',
      'info',
    )
    return false
  }
  
  document.querySelector('#update-customer-act').style.display = `none`
  document.querySelector('#add-customer-act').style.display = `block`
  document.querySelector('#customer-id-field').removeAttribute('disabled')
  document.querySelector('#customer-update-info h2').innerHTML = `${firstUppercase(value)} Customer`
  document.querySelector('#customer-id-field').value = ``
  document.querySelector('#customer-name-field').value = ``
  document.querySelector('#customer-alias-field').value = ``
  document.querySelector('#customer-address-field').value = ``
  document.querySelector('#customer-phone-field').value = ``
  document.querySelector('#customer-fax-field').value = ``
  document.querySelector('#npwp-number-field').value = ``
  document.querySelector('#customer-npwp-field').value = ``
  document.querySelector('#customer-website-field').value = ``
  document.querySelector('#customer-pic-field').value = ``
  document.querySelector('#customer-email-field').value = ``
  document.querySelector('#customer-country-field').value = `ID`
  document.querySelector('#customer-type-field').value = `domestic`

  
  if(value == "update"){
    customerId =  selectedRow.querySelector('.col-customer_id').getAttribute('data-customer_id')
    customerName =  selectedRow.querySelector('.col-customer_name').getAttribute('data-customer_name')
    customerType =  selectedRow.querySelector('.col-customer_type').getAttribute('data-customer_type')
    customerAlias =  selectedRow.querySelector('.col-customer_alias').getAttribute('data-customer_alias')
    countryCode =  selectedRow.querySelector('.col-country_code').getAttribute('data-country_code')
    addressName =  selectedRow.querySelector('.col-customer_address').getAttribute('data-customer_address')
    numberPhone =  selectedRow.querySelector('.col-customer_telp').getAttribute('data-customer_telp')
    numberFax =  selectedRow.querySelector('.col-customer_fax').getAttribute('data-customer_fax')
    npwpNumber =  selectedRow.querySelector('.col-customer_npwp').getAttribute('data-customer_npwp')
    customerNpwp =  selectedRow.querySelector('.col-customer_npwp16').getAttribute('data-customer_npwp16')
    customerWebsite =  selectedRow.querySelector('.col-customer_website').getAttribute('data-customer_website')
    customerPic =  selectedRow.querySelector('.col-customer_att').getAttribute('data-customer_att')
    email =  selectedRow.querySelector('.col-customer_email').getAttribute('data-customer_email')
    document.querySelector('#update-customer-act').style.display = `block`
    document.querySelector('#add-customer-act').style.display = `none`
    document.querySelector('#customer-id-field').setAttribute('disabled', true)

    document.querySelector('#customer-id-field').value = `${customerId}`
    document.querySelector('#customer-name-field').value = `${customerName}`
    document.querySelector('#customer-type-field').value = `${customerType}`
    document.querySelector('#customer-alias-field').value = `${customerAlias}`
    document.querySelector('#customer-country-field').value = `${countryCode}`
    document.querySelector('#customer-address-field').value = `${addressName}`
    document.querySelector('#customer-phone-field').value = `${numberPhone}`
    document.querySelector('#customer-fax-field').value = `${numberFax}`
    document.querySelector('#npwp-number-field').value = `${npwpNumber}`
    document.querySelector('#customer-npwp-field').value = `${customerNpwp}`
    document.querySelector('#customer-website-field').value = `${customerWebsite}`
    document.querySelector('#customer-pic-field').value = `${customerPic}`
    document.querySelector('#customer-email-field').value = `${email}`
  }
  openModal(modals[0])
} 

// UPDATE FUNCTION TO ADD OR UPDATE AREA --ir
function updateCustomer(act) {
  if(!checkPrivileged('update', 'mst_customer')) return false

  customerId =  document.querySelector("#customer-id-field").value
  customerName =  document.querySelector("#customer-name-field").value
  customerType =  document.querySelector("#customer-type-field").value
  customerAlias =  document.querySelector("#customer-alias-field").value
  countryCode =  document.querySelector("#customer-country-field").value
  addressName =  document.querySelector('#customer-address-field').value
  numberPhone =  document.querySelector('#customer-phone-field').value
  numberFax =  document.querySelector('#customer-fax-field').value
  npwpNumber =  document.querySelector('#npwp-number-field').value
  customerNpwp =  document.querySelector('#customer-npwp-field').value
  customerWebsite =  document.querySelector('#customer-website-field').value
  customerPic =  document.querySelector('#customer-pic-field').value
  email =  document.querySelector('#customer-email-field').value

  let isAllInputed = checkFieldAreInputedOnGroup('#customer-update-info', [])
  if (!isAllInputed) {
    Swal.fire(
      'Hold on!',
      'Please input customer id, name and type!',
      'warning',
    )
    return false
  }

  infoSwal = `<span>Customer Id : <b> ${customerId} </b></span><br> `
  infoSwal += `<span>Customer Name : <b> ${customerName} </b></span><br> `
  infoSwal += `<span>Customer Alias : <b> ${(customerAlias)} </b></span><br> `
  infoSwal += `<span>Customer Type : <b> ${firstUppercase(customerType)} </b></span><br> `
  infoSwal += `<span>Customer Country : <b> ${(countryCode)} </b></span>`
  infoSwal += `<span>Address Name : <b> ${(addressName)} </b></span>`
  infoSwal += `<span>Number Phone : <b> ${(numberPhone)} </b></span>`
  infoSwal += `<span>Number Fax : <b> ${(numberFax)} </b></span>`
  infoSwal += `<span>Npwp Number : <b> ${(npwpNumber)} </b></span>`
  infoSwal += `<span>Customer Npwp16 : <b> ${(customerNpwp)} </b></span>`
  infoSwal += `<span>Website : <b> ${(customerWebsite)} </b></span>`
  infoSwal += `<span>PIC Customer : <b> ${(customerPic)} </b></span>`
  infoSwal += `<span>Email : <b> ${(email)} </b></span>`

  iconSwal = `<i class="fa fa-plus"></i>`
  if(act == "update") iconSwal = `<i class="fas fa-pencil-alt"></i>`
  
  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to `+ act +` this customer? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: "Yes!",
    confirmButtonText: `${iconSwal} Yes, ${act} this!`,
    confirmButtonAriaLabel: 'Update!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'updateCustomer',
        type: 'POST',
        dataType: "JSON",
        data: {
          customer_id: customerId, 
          customer_name: customerName, 
          customer_alias: customerAlias,  
          customer_type: customerType,  
          country_code: countryCode,  
          address_name: addressName,  
          number_phone: numberPhone,  
          number_fax: numberFax,  
          npwp_number: npwpNumber,  
          customer_npwp: customerNpwp,  
          customer_website: customerWebsite,  
          customer_pic: customerPic,  
          email: email,  
          act: act, 
        }, 
        beforeSend: function (){
          openLoader()
        }, success: function (data){
          if(data == "success"){
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully ${act} this customer! <br><br>` + infoSwal
            })
          }else{
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to ${act} this customer! <br><br>` + infoSwal
            })
          }
        }, complete: function (){
          closeLoader()
          closeModal()
          setCustomer()
        }
      })
    }else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to ${act} this customer! <br><br>` + infoSwal
      })
    }
  })
}