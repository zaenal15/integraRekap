pangkalanLayout = document.querySelector('#pangkalan-layout-section')
clearAllIntevalFunction()
setPangkalan()

setTables = ['table-pangkalan']
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

modals = ["#modal-update-pangkalan"]
fillModalContent(modals)
tablepangkalan = document.querySelector('#table-pangkalan')
tablepangkalanHead = tablepangkalan.querySelector('thead')
tablepangkalanBody = tablepangkalan.querySelector('tbody')

function setPangkalan() {
  loadData('loadPangkalan').then(function (newData) {
    pangkalanList = newData.data
    console.log('pangkalanList ', pangkalanList)
  }).then(() => {
    openLoader()
    tablepangkalanBody.innerHTML = ``
    $('#table-pangkalan').DataTable().clear().destroy()
  }).then(() => {
    for (key in pangkalanList) {
      tablepangkalanBody.innerHTML += `<tr data-pangkalan="${pangkalanList[key].id}"></tr>`
      tablepangkalanBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-pangkalan"])
      for (keyValue in pangkalanList[key]) {
        value = pangkalanList[key][keyValue]
        text = firstUppercase(value)
        tablepangkalanBody.querySelector('tr:last-child .col-' + keyValue).setAttribute('data-' + keyValue, value)
        tablepangkalanBody.querySelector('tr:last-child .col-' + keyValue).innerHTML += text
      }
    }
  }).then(() => {
    closeLoader()
    hideColumns(tablepangkalan, ['id'])
    disabledDownload = false
    setBasicDataTablePlugin($('#table-pangkalan'), true, 100, disabledDownload)
  })
}


function updatePangkalanModal(value) {
  // Pastikan baris yang dipilih memiliki kelas 'selected'
  selectedRow = document.querySelector('#table-pangkalan tr.selected')

  if (!selectedRow && value == "update") {
    Swal.fire(
      'Hold on!',
      'Please select peserta first!',
      'info',
    )
    return false
  }

  // Reset form fields terlebih dahulu
  document.querySelector('#nama-pangkalan-field').value = ''
  document.querySelector('#id-pangkalan-field').value = ''

  if (value == 'add') {
    document.getElementById('update-pangkalan-btn').style.display = 'none'
    document.getElementById('add-pangkalan-btn').style.display = 'block'
    document.querySelector('#modal-update-pangkalan .modal-head h2').innerText = 'Tambah Pangkalan'
  }

  if (value == 'update') {
    // Ambil data dari elemen dalam baris yang dipilih
    let id = selectedRow.querySelector('.col-id').getAttribute('data-id')
    let pangkalan = selectedRow.querySelector('.col-nama_pangkalan').getAttribute('data-nama_pangkalan')

    document.querySelector('#nama-pangkalan-field').value = pangkalan
    document.querySelector('#id-pangkalan-field').value = id

    document.getElementById('update-pangkalan-btn').style.display = 'block'
    document.getElementById('add-pangkalan-btn').style.display = 'none'
    document.querySelector('#modal-update-pangkalan .modal-head h2').innerText = 'Perbarui Pangkalan'
  }

  openModal(modals[0])
}

function updatePangkalan(act) {
  if (!checkPrivileged('update', 'mst_pangkalan')) return false

  let idPangkalan = document.querySelector('#id-pangkalan-field').value
  let namaPangkalan = document.querySelector("#nama-pangkalan-field").value

  let isAllInputed = checkFieldAreInputedOnGroup('#pangkalan-update-info', [])
  console.log('isAllInputed', isAllInputed)
  if (!isAllInputed) {
    Swal.fire(
      'Hold on!',
      'Please input pangkalan name!',
      'warning',
    )
    return false
  }

  let infoSwal = `<span>Nama Pangkalan : <b> ${namaPangkalan} </b></span><br>
                  <span>ID Pangkalan : <b> ${idPangkalan} </b></span><br>
                `

  let iconSwal = `<i class="fa fa-plus"></i>`
  if (act == "update") iconSwal = `<i class="fas fa-pencil-alt"></i>`

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to ` + act + ` this pangkalan? <br><br>` + infoSwal,
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
        url: 'updatePangkalan',  // Ubah URL untuk update pangkalan
        type: 'POST',
        dataType: "JSON",
        data: {
          id: idPangkalan,
          nama_pangkalan: namaPangkalan,
          act: act,
        },
        beforeSend: function () {
          openLoader()
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully ${act} this pangkalan! <br><br>` + infoSwal
            })
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to ${act} this pangkalan! <br><br>` + infoSwal
            })
          }
        },
        complete: function () {
          closeLoader()
          closeModal()
          setPangkalan() // Jika perlu, tambahkan fungsi untuk memperbarui tampilan tabel pangkalan
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to ${act} this pangkalan! <br><br>` + infoSwal
      })
    }
  })
}


function deletePangkalan() {
  // Ambil baris yang terpilih dari tabel
  selectedRow = document.querySelector('#table-pangkalan tr.selected');
  if (!selectedRow) {
    Swal.fire(
      'Perhatian!',
      'Silakan pilih pangkalan terlebih dahulu!',
      'info',
    );
    return false;
  }

  // Ambil data dari atribut-atribut di dalam baris yang terpilih
  id = selectedRow.querySelector('.col-id').getAttribute('data-id');
  namaPangakalan = selectedRow.querySelector('.col-nama_pangkalan').getAttribute('data-nama_pangkalan');
  
  // Menyusun info untuk ditampilkan di SweetAlert
  infoSwal = `<span>Peserta ID : <b> ${id} </b></span><br>`;
  infoSwal += `<span>No Peserta : <b> ${namaPangakalan} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus pangkalan ini? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: 'Ya, hapus peserta ini!',
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      // Kirim data ke server untuk menghapus peserta
      $.ajax({
        url: 'deletePangkalan',
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          nama_pangkalan: namaPangakalan,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Pangkalan ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus pangkalan ini! <br><br>` + infoSwal
            });
          }
        },
        complete: function () {
          setPangkalan(''); // Refresh data peserta
          closeLoader(); // Sembunyikan loader
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus ppangakalan ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}