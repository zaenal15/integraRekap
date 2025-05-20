// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

setTables = ['table-mata-lomba']
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

setMataLomba()
setDataFecth()

// ADD CONTENT MODAL
modals = ["#modal-update-lomba","#modal-update-kategori-lomba"]
fillModalContent(modals)
modalCustomer = document.querySelector(modals[0])

// SET AREA LISTS --ir
tableMataLomba = document.querySelector('#table-mata-lomba')
tableMataLombaHead = tableMataLomba.querySelector('thead')
tableMataLombaBody = tableMataLomba.querySelector('tbody')

function setMataLomba() {
  loadData('loadLomba').then(function (newData) {
    lombaLists = newData.data
    console.log('lombaLists ', lombaLists)
  }).then(() => {
    openLoader()
    $('#table-mata-lomba').DataTable().clear().destroy();
    tableMataLombaBody.innerHTML = ``;
  }).then(() => {
    newRow = ``
    for (key in lombaLists) {
      newRow +=  `<tr data-lomba="${lombaLists[key].id}">`
      // tableMataLombaBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-mata-lomba"])
      for (keyValue in lombaLists[key]) {
        value = lombaLists[key][keyValue]
        text = firstUppercase(value)

        newRow += '<td class="col-' + keyValue + '" data-' + keyValue + '="' + value + '">' + text + '</td>'
        // tableMataLombaBody.querySelector('tr:last-child .col-' + keyValue).setAttribute('data-' + keyValue, value)
        // tableMataLombaBody.querySelector('tr:last-child .col-' + keyValue).innerHTML += text
      }
      newRow += '</tr>'
    }

    tableMataLombaBody.innerHTML += newRow
  }).then(() => {
    closeLoader()
    hideColumns(tableMataLomba, ['lomba_id', 'kategori_id'])
    disabledDownload = false
    setBasicDataTablePlugin($('#table-mata-lomba'), true, 100, disabledDownload)
  })
}

function updateMataLombaModal(value) {
  // Pastikan baris yang dipilih memiliki kelas 'selected'
  selectedRow = document.querySelector('#table-mata-lomba tr.selected')

  if (!selectedRow && value == "update") {
    Swal.fire(
      'Hold on!',
      'Please select mata lomba first!',
      'info',
    )
    return false
  }

  // Reset form fields terlebih dahulu
  document.querySelector('#nama-lomba-field').value = ''
  document.querySelector('#lomba-id-field').value = ''
  $('#kategori-lomba-field').val(null).trigger('change');

  if (value == 'add') {
    document.getElementById('update-lomba-btn').style.display = 'none'
    document.getElementById('add-lomba-btn').style.display = 'block'
    document.querySelector('#modal-update-lomba .modal-head h2').innerText = 'Tambah Mata Lomba'
  }

  if (value == 'update') {
    // Ambil data dari elemen dalam baris yang dipilih
    let id = selectedRow.querySelector('.col-lomba_id').getAttribute('data-lomba_id')
    let namaLomba = selectedRow.querySelector('.col-nama_lomba').getAttribute('data-nama_lomba')
    let kategoriId = selectedRow.querySelector('.col-kategori_id').getAttribute('data-kategori_id')

    document.querySelector('#nama-lomba-field').value = namaLomba
    document.querySelector('#lomba-id-field').value = id
    $('#kategori-lomba-field').val(kategoriId).trigger('change');

    document.getElementById('update-lomba-btn').style.display = 'block'
    document.getElementById('add-lomba-btn').style.display = 'none'
    document.querySelector('#modal-update-lomba .modal-head h2').innerText = 'Perbarui Mata Lomba'
  }

  openModal(modals[0])
}


async function setDataFecth() {

  // SET SELECT LOMBA
  const fetchDataLomba = await fetch('/loadKategoriLomba', {
    method: 'POST',
  })
  const kategoriLombaData = await fetchDataLomba.json()
  const kategoriLombaLists = kategoriLombaData.data
  console.log('kategoriLombaLists', kategoriLombaLists)
  
  
  const kategoriLombaField = document.getElementById('kategori-lomba-field')
  let kategoriLombaListsField = `<option value="">--- Pilih Kategori Lomba ---</option>`
  for (const key in kategoriLombaLists) {
    const item = kategoriLombaLists[key]
    kategoriLombaListsField += `<option value="${item["kategori_id"]}" >${item["nama_kategori"]}</option>`
  }
  kategoriLombaField.innerHTML = kategoriLombaListsField
  setPluginSelect2("#kategori-lomba-field")

  const fetchDataLomba1 = await fetch('/loadLombaKategori', {
    method: 'POST',
  })
  const kategoriLombaData1 = await fetchDataLomba1.json()
  const kategoriLombaLists1 = kategoriLombaData1.data
  console.log('kategoriLombaLists1', kategoriLombaLists1)
}

function updateLomba(act) {

  let idLomba = document.querySelector('#lomba-id-field').value
  let namaLomba = document.querySelector("#nama-lomba-field").value
  let kategoriId = document.querySelector("#kategori-lomba-field").value
  let jumlahJuri = document.querySelector("#jumlah-juri-field").value

  let isAllInputed = checkFieldAreInputedOnGroup('#lomba-update-info', [])
  if (!isAllInputed) {
    Swal.fire(
      'Hold on!',
      'Please input mata lomba name and category!',
      'warning',
    )
    return false
  }

  let infoSwal = `<span>Nama Lomba : <b> ${namaLomba} </b></span><br>
                  <span>ID Lomba : <b> ${idLomba} </b></span><br>
                  <span>Kategori Lomba : <b> ${kategoriId} </b></span><br>
                `

  let iconSwal = `<i class="fa fa-plus"></i>`
  if (act == "update") iconSwal = `<i class="fas fa-pencil-alt"></i>`

  Swal.fire({
    title: "Hold on!",
    html: `Are you sure to ` + act + ` this mata lomba? <br><br>` + infoSwal,
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
        url: 'updateLomba',  // Ubah URL untuk update mata lomba
        type: 'POST',
        dataType: "JSON",
        data: {
          id: idLomba,
          nama_lomba: namaLomba,
          kategori_id: kategoriId,
          jumlah_juri: Number(jumlahJuri),
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
              html: `Successfully ${act} this mata lomba! <br><br>` + infoSwal
            })
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to ${act} this mata lomba! <br><br>` + infoSwal
            })
          }
        },
        complete: function () {
          closeLoader()
          closeModal()
          setMataLomba()
        }
      })
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to ${act} this mata lomba! <br><br>` + infoSwal
      })
    }
  })
}

function deleteLomba() {
  // Ambil baris yang terpilih dari tabel
  selectedRow = document.querySelector('#table-mata-lomba tr.selected');
  if (!selectedRow) {
    Swal.fire(
      'Perhatian!',
      'Silakan pilih mata lomba terlebih dahulu!',
      'info',
    );
    return false;
  }

  // Ambil data dari atribut-atribut di dalam baris yang terpilih
  id = selectedRow.querySelector('.col-lomba_id').getAttribute('data-lomba_id');
  namaLomba = selectedRow.querySelector('.col-nama_lomba').getAttribute('data-nama_lomba');

  // Menyusun info untuk ditampilkan di SweetAlert
  infoSwal = `<span>Lomba ID : <b> ${id} </b></span><br>`;
  infoSwal += `<span>Nama Lomba : <b> ${namaLomba} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus mata lomba ini? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: 'Ya, hapus mata lomba ini!',
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      // Kirim data ke server untuk menghapus mata lomba
      $.ajax({
        url: 'deleteLomba',  // Ubah URL untuk menghapus mata lomba
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          nama_lomba: namaLomba,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Mata lomba ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus mata lomba ini! <br><br>` + infoSwal
            });
          }
        },
        complete: function () {
          setMataLomba()
          closeLoader(); // Sembunyikan loader
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus mata lomba ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}

async function updateKategoriLombaModal(value) {
  openModal(modals[1])
  setKategoriModal()
}

async function updateKategoriLomba(el, act) {
  // Mengambil nilai nama kategori dari input
  if (act == 'add') {
    idKategori = ''
    namaKategori = document.querySelector("#add-kategori-lomba-field").value;

    if (!namaKategori) {
      Swal.fire(
        'Hold on!',
        'Please input category name!',
        'warning'
      );
      return false;
    }
  }

  if (act == "edit") {
    boxCategoryList = el.closest('.box-category-content')
    console.log('boxCategoryList', boxCategoryList)
    document.querySelectorAll('.box-category-content').forEach(box =>{
      box.classList.remove('active')
    })
    boxCategoryList.classList.add('active')
  }

  if (act == "update") {
    boxCategoryList = el.closest('.box-category-content')
    idKategori = boxCategoryList.getAttribute('category-id')
    namaKategori = boxCategoryList.querySelector('input').value
  }


  // Cek apakah nama kategori sudah diinput

  if (act == 'add' || act == 'update') {

    // Menyusun informasi yang akan ditampilkan di SweetAlert
    let infoSwal = `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;

    // Menentukan ikon SweetAlert tergantung pada aksi
    let iconSwal = `<i class="fa fa-plus"></i>`;

    Swal.fire({
      title: "Hold on!",
      html: `Are you sure to ` + act + ` this kategori lomba? <br><br>` + infoSwal,
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
          url: 'updateKategori',  // Ubah URL untuk update kategori lomba
          type: 'POST',
          dataType: "JSON",
          data: {
            id: idKategori,  // Pastikan idKategori diambil dengan benar
            nama_kategori: namaKategori,  // Pastikan namaKategori diambil dengan benar
            act: act,
          },
          beforeSend: function () {
            openLoader();
          },
          success: function (data) {
            if (data == "success") {
              Swal.fire({
                title: '<strong>Success</strong>',
                icon: 'success',
                html: `Successfully ${act} this kategori lomba! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Hold on!</strong>',
                icon: 'warning',
                html: `Failed to ${act} this kategori lomba! <br><br>` + infoSwal
              });
            }
          },
          complete: function () {
            closeLoader();
            setKategoriModal()
            setDataFetch()
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Cancel to ${act} this kategori lomba! <br><br>` + infoSwal
        });
      }
    });
  }

}

async function setKategoriModal() {
  const fetchDataLomba = await fetch('/loadKategoriLomba', {
    method: 'POST',
  })
  const kategoriLombaData = await fetchDataLomba.json()
  const kategoriLombaLists = kategoriLombaData.data
  const kategoriLombaModal = document.getElementById('wrap-content-list-category')
  let kategoriLombaListsModal = ``
  for (const key in kategoriLombaLists) {
    const item = kategoriLombaLists[key]
    kategoriLombaListsModal += ` 
    <section category-id="${item["kategori_id"]}" class="box-category-content">
      <label>${item["nama_kategori"]}</label>
      <input category-id="${item["kategori_id"]}"  value="${item["nama_kategori"]}" style="display: none;" type="text">
      <button id="edit-kategori-lomba-btn" onclick="updateKategoriLomba(this,'edit')" class="edit"><i class="fas fa-pencil-alt"></i></button>
      <button id="update-kategori-lomba-btn" onclick="updateKategoriLomba(this,'update')" class="edit"><i class='bx bxs-save'></i></button>
      <button  class="delete" onclick="deleteKategori(this)"><i class="fa fa-trash"></i></button>
    </section>`
  }
  kategoriLombaModal.innerHTML = kategoriLombaListsModal
}

function deleteKategori(el) {
  boxCategoryList = el.closest('.box-category-content')
  id = boxCategoryList.getAttribute('category-id')
  namaKategori = boxCategoryList.querySelector('input').value

  // Menyusun info untuk ditampilkan di SweetAlert
  infoSwal = `<span>Kategori ID : <b> ${id} </b></span><br>`;
  infoSwal += `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus kategori lomba ini? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: 'Ya, hapus kategori lomba ini!',
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      // Kirim data ke server untuk menghapus kategori lomba
      $.ajax({
        url: 'deleteKategori',  // Ubah URL untuk menghapus kategori lomba
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          nama_kategori: namaKategori,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Kategori lomba ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus kategori lomba ini! <br><br>` + infoSwal
            });
          }
        },
        complete: function () {
          setKategoriModal()
          setDataFetch()
          closeLoader();
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus kategori lomba ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}

async function setDataFetch() {
  // SET SELECT KATEGORI LOMBA
  const fetchDataLomba = await fetch('/loadKategoriLomba', {
    method: 'POST',
  })
  const kategoriLombaData = await fetchDataLomba.json()
  const kategoriLombaLists = kategoriLombaData.data
  console.log('kategoriLombaLists', kategoriLombaLists)

  const kategoriLombaField = document.getElementById('kategori-lomba-field')
  let kategoriLombaListsField = `<option value="">--- Pilih Kategori Lomba ---</option>`

  for (const key in kategoriLombaLists) {
    const item = kategoriLombaLists[key]
    kategoriLombaListsField += `<option value="${item["kategori_id"]}">${item["nama_kategori"]}</option>`
  }
  kategoriLombaField.innerHTML = kategoriLombaListsField
  setPluginSelect2("#kategori-lomba-field")
}

