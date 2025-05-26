clearAllIntevalFunction()
modals = ["#modal-update-peserta", "#modal-token-peserta"]
fillModalContent(modals)

setDataFecth()
setPeserta()



// SET AREA LISTS --ir
// tablePeserta = document.querySelector('#table-peserta')
// tablePesertaHead = tablePeserta.querySelector('thead')
// tablePesertaBody = tablePeserta.querySelector('tbody')

// async function setPeserta() {
//   loadData('loadPeserta').then(function (newData) {
//     pesertaLists = newData.data
//     console.log('pesertaLists ', pesertaLists)
//   }).then(() => {
//     openLoader()
//     tablePesertaBody.innerHTML = ``
//     $('#table-peserta').DataTable().clear().destroy()
//   }).then(() => {
//     for (key in pesertaLists) {
//       tablePesertaBody.innerHTML += `<tr data-peserta="${pesertaLists[key].id}"></tr>`
//       tablePesertaBody.querySelector('tr:last-child').innerHTML += setTemplateCols(tablesColumn["table-peserta"])
//       for (keyValue in pesertaLists[key]) {
//         value = pesertaLists[key][keyValue]
//         text = firstUppercase(value)
//         tablePesertaBody.querySelector('tr:last-child .col-' + keyValue).setAttribute('data-' + keyValue, value)
//         tablePesertaBody.querySelector('tr:last-child .col-' + keyValue).innerHTML += text
//       }
//     }
//   }).then(() => {
//     closeLoader()
//     hideColumns(tablePeserta, ['id', 'lomba_id','pangkalan_id'])
//     disabledDownload = false
//     setBasicDataTablePlugin($('#table-peserta'), true, 100, disabledDownload);
//   })
// }
// async function setPeserta() {
//   try {
//     openLoader(); // Open loader at the start

//     // Load the data and ensure it's an array
//     const newData = await loadData('loadPeserta');
//     let pesertaLists = newData.data;

//     // Check if pesertaLists is an array, if not, convert it to an array using Object.values()
//     if (!Array.isArray(pesertaLists)) {
//       pesertaLists = Object.values(pesertaLists);
//     }

//     // Group participants by 'nama_pangkalan' efficiently using reduce
//     const pangkalanGroups = pesertaLists.reduce((groups, participant) => {
//       if (!groups[participant.nama_pangkalan]) {
//         groups[participant.nama_pangkalan] = [];
//       }
//       groups[participant.nama_pangkalan].push(participant);
//       return groups;
//     }, {});

//     // Build HTML in memory before inserting it into the DOM
//     let html = Object.keys(pangkalanGroups).map(pangkalanName => {
//       const participants = pangkalanGroups[pangkalanName];
//       return `
//         <div onclick="selectPeserta(this)" class="participant-group">
//           <div class="pangkalan-header">
//             <img style="width: 123px;" src="../../assets/img/il-1.svg" alt="">
//             <div >No Peserta :</div>
//             <div class="no-peserta">${participants[0].no_peserta}</div>
//           </div>

//           <section class="pangkalan-body">
//             <section class="pangkalan-info">
//               <span pangkalan-id="${participants[0].pangkalan_id}" class="pangkalan-name">${pangkalanName}</span>
//               <span data-regu="${participants[0].regu}" class="regu">Regu: ${participants[0].regu}</span>
//               <button class="update-peserta-lomba" onclick="updatePesertaModal(this,'update')"><i class="fas fa-pencil-alt"></i> </button>
//             </section>
           
//             <section class="lomba-list">
//               ${participants.map(participant => `
//                 <section class="lomba-item">
//                   <img style="width: 12px;" src="../../assets/img/check-icon-blue.svg" alt="">
//                   <span class="lomba-header" lomba-id="${participant.lomba_id}">${participant.nama_lomba}</span>
//                 </section>
//               `).join('')}
//             </section>
//           </section>
//         </div>
//       `;
//     }).join('');

//     // Insert the HTML into the DOM
//     document.getElementById('participants-container').innerHTML = html;

//   } catch (error) {
//     console.error("Error loading data:", error);
//   } finally {
//     closeLoader(); // Close loader after all operations
//   }
// }


async function setPeserta() {
  try {
    openLoader(); // Open loader at the start
    let response = await fetch('/loadPesertaList', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Error loading data');
    }

    pesertaData = await response.json();
    pesertaLists = pesertaData.data;

    // Ubah object menjadi array dan urutkan berdasarkan no_peserta
    const sortedPesertaArray = Object.values(pesertaLists).sort((a, b) => {
      const numA = parseInt(a.no_peserta.split('-')[2], 10);
      const numB = parseInt(b.no_peserta.split('-')[2], 10);
      return numA - numB;
    });

    let contentPeserta = ``;

    console.log('sortedPesertaArray', sortedPesertaArray)
    for (let item of sortedPesertaArray) {
      // Generate mata_lomba content
      let lombaContent = item.mata_lomba.map(lomba => {
        return `
      <section class="lomba-item">
        <img style="width: 12px;" src="../../assets/img/check-icon-blue.svg" alt="">
        <span class="lomba-header" lomba-id="${lomba.lomba_id}">${lomba.nama_lomba}</span>
      </section>
    `;
      }).join('');

      // Tambahkan konten peserta
      contentPeserta += `
    <div onclick="selectPeserta(this)" 
         class="participant-group"
         data-id="${item.id}"
         data-no_peserta="${item.no_peserta}"
         data-regu="${item.regu}"
         data-jenis_regu="${item.jenis_regu}"
         data-tingkat_peserta="${item.tingkat_peserta}"
         data-pangkalan_id="${item.pangkalan_id}"
         data-no_wa="${item.no_wa}">

      <div class="pangkalan-header">
        <img style="width: 123px;" src="../../assets/img/il-1.svg" alt="">
        <div>No Peserta :</div>
        <div class="no-peserta">${item.no_peserta}</div>
      </div>

      <section class="pangkalan-body">
        <section class="pangkalan-info">
          <span pangkalan-id="${item.pangkalan_id}" class="pangkalan-name">${item.nama_pangkalan}</span>
          <span style="text-transform: capitalize;" data-regu="${item.regu}" class="regu">Regu: ${item.regu} (${item.jenis_regu})</span>
          <button class="update-peserta-lomba" onclick="updatePesertaModal(this, 'update')"><i class="fas fa-pencil-alt"></i></button>
        </section>

        <section class="lomba-list">
          ${lombaContent}
        </section>
      </section>
    </div>
  `;
    }

    // Insert the HTML into the DOM
    document.getElementById('participants-container').innerHTML = contentPeserta;

  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    closeLoader(); // Close loader after all operations
  }
}



function updatePesertaModal(el, value) {
  if (value == 'add') {
    document.getElementById('update-peserta-btn').style.display = 'none'
    document.getElementById('add-peserta-btn').style.display = 'block'
    document.querySelector('#modal-update-peserta .modal-head h2').innerText = 'Tambah Peserta'
    setDataFecth()
  }

  if (value === 'update') {
    selectedRow = el.closest('.participant-group');

    // Ambil data dari data-* attributes
    const noPeserta = selectedRow.dataset.no_peserta || '';
    const regu = selectedRow.dataset.regu || '';
    const pangkalanId = selectedRow.dataset.pangkalan_id || '';
    const jenisRegu = selectedRow.dataset.jenis_regu || '';
    const tingkatPeserta = selectedRow.dataset.tingkat_peserta || '';
    const noWa = selectedRow.dataset.no_wa || '';

    // Atur tampilan tombol dan judul modal
    document.getElementById('add-peserta-btn').style.display = 'none';
    document.getElementById('update-peserta-btn').style.display = 'block';
    document.querySelector('#modal-update-peserta .modal-head h2').innerText = 'Perbarui Peserta';

    // Reset semua checkbox mata lomba
    document.querySelectorAll('#mata-lomba-field input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Centang checkbox yang sesuai dengan lomba yang sudah diikuti
    const mataLombaIds = [];
    selectedRow.querySelectorAll('.lomba-item').forEach(box => {
      const lombaId = box.querySelector('.lomba-header')?.getAttribute('lomba-id');
      if (lombaId) mataLombaIds.push(lombaId);
    });

    mataLombaIds.forEach(val => {
      const checkbox = document.querySelector(`#mata-lomba-field input[type="checkbox"][data-value="${val}"]`);
      if (checkbox) checkbox.checked = true;
    });

    // Isi field di dalam form modal
    document.querySelector('#no-peserta-field').value = noPeserta;
    document.querySelector('#regu-field').value = regu;
    document.querySelector('#no-wa-field').value = noWa;
    document.querySelector('#jenis-regu-field').value = jenisRegu;
    document.querySelector('#tingkat-peserta-field').value = tingkatPeserta;
    $('#pangkalan-field').val(pangkalanId).trigger('change');

  }
    openModal(modals[0]);
}


function updatePeserta(act) {
  if (!checkPrivileged('update', 'mst_peserta')) return false;

  const noPeserta = document.querySelector("#no-peserta-field").value.trim();
  const regu = document.querySelector("#regu-field").value.trim();
  const pangkalanId = document.querySelector("#pangkalan-field").value;
  const jenisRegu = document.querySelector("#jenis-regu-field").value;
  const tingkatPeserta = document.querySelector("#tingkat-peserta-field").value;
  const noWa = document.querySelector("#no-wa-field").value.trim();

  const mataLombaIds = [];
  document.querySelectorAll('input[name="mata-lomba"]:checked').forEach((checkbox) => {
    mataLombaIds.push(checkbox.getAttribute('data-value'));
  });

  // Validasi input
  if (!noPeserta || !regu || !pangkalanId || !jenisRegu || !tingkatPeserta || !noWa || mataLombaIds.length < 1) {
    Swal.fire(
      'Hold on!',
      'Silakan lengkapi semua isian, termasuk No WA dan Mata Lomba!',
      'warning'
    );
    return false;
  }

  const infoSwal = `
    <span>No Peserta: <b>${noPeserta}</b></span><br>
    <span>Regu: <b>${regu}</b></span><br>
    <span>Pangkalan ID: <b>${pangkalanId}</b></span><br>
    <span>Jenis Regu: <b>${jenisRegu}</b></span><br>
    <span>Tingkat Peserta: <b>${tingkatPeserta}</b></span><br>
    <span>No WA: <b>${noWa}</b></span><br>
    <span>Mata Lomba ID(s): <b>${mataLombaIds.join(', ')}</b></span>
  `;

  const iconSwal = act === "update"
    ? `<i class="fas fa-pencil-alt"></i>`
    : `<i class="fa fa-plus"></i>`;

  Swal.fire({
    title: "Konfirmasi",
    html: `Anda yakin ingin <b>${act}</b> peserta berikut?<br><br>${infoSwal}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: `${iconSwal} Ya, ${act}!`,
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'updatePeserta',
        type: 'POST',
        dataType: "JSON",
        data: {
          no_peserta: noPeserta,
          regu: regu,
          pangkalan_id: pangkalanId,
          jenis_regu: jenisRegu,
          tingkat_peserta: tingkatPeserta,
          no_wa: noWa,
          mata_lomba_ids: mataLombaIds,
          act: act
        },
        beforeSend: openLoader,
        success: function (data) {
          Swal.fire({
            title: data === "success" ? 'Berhasil' : 'Gagal',
            icon: data === "success" ? 'success' : 'warning',
            html: `${data === "success" ? 'Data peserta berhasil diperbarui.' : 'Gagal memperbarui data peserta.'}<br><br>${infoSwal}`
          });
        },
        complete: function () {
          closeLoader();
          closeModal();
          setPeserta();
        }
      });
    } else {
      Swal.fire({
        title: 'Dibatalkan',
        icon: 'info',
        html: `Aksi ${act} peserta dibatalkan.<br><br>${infoSwal}`
      });
    }
  });
}

function deletePeserta() {
  // Ambil baris yang terpilih dari tabel
  selectedRow = document.querySelector('#participants-container .participant-group.active');
  if (!selectedRow) {
    Swal.fire(
      'Perhatian!',
      'Silakan pilih peserta terlebih dahulu!',
      'info',
    );
    return false;
  }

  // Ambil data dari atribut-atribut di dalam baris yang terpilih
  // id = selectedRow.querySelector('.col-id').getAttribute('data-id');
  noPeserta = selectedRow.querySelector('.no-peserta').textContent
  console.log('noPeserta', noPeserta)
  // namaPeserta = selectedRow.querySelector('.col-nama_peserta').getAttribute('data-nama_peserta');
  // regu = selectedRow.querySelector('.col-regu').getAttribute('data-regu');
  // pangkalan = selectedRow.querySelector('.col-pangkalan').getAttribute('data-pangkalan');
  // mataLomba = selectedRow.querySelector('.col-mata_lomba').getAttribute('data-mata_lomba');
  // mataLombaCode = selectedRow.querySelector('.col-mata_lomba_code').getAttribute('data-mata_lomba_code');

  // Menyusun info untuk ditampilkan di SweetAlert
  // infoSwal = `<span>Peserta ID : <b> ${id} </b></span><br>`;
  infoSwal = `<span>No Peserta : <b> ${noPeserta} </b></span><br>`;
  // infoSwal += `<span>Nama Peserta : <b> ${namaPeserta} </b></span><br>`;
  // infoSwal += `<span>Regu : <b> ${regu} </b></span><br>`;
  // infoSwal += `<span>Pangkalan : <b> ${pangkalan} </b></span><br>`;
  // infoSwal += `<span>Mata Lomba : <b> ${mataLomba} </b></span><br>`;
  // infoSwal += `<span>Mata Lomba Code : <b> ${mataLombaCode} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus peserta ini? <br><br>` + infoSwal,
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
        url: 'deletePeserta',
        type: 'POST',
        dataType: "JSON",
        data: {
          no_peserta: noPeserta,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Peserta ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus peserta ini! <br><br>` + infoSwal
            });
          }
        },
        complete: function () {
          setPeserta(''); // Refresh data peserta
          closeLoader(); // Sembunyikan loader
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus peserta ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}

async function setDataFecth() {
  // SET SELECT LOMBA
  const fetchDataLomba = await fetch('/loadLomba', {
    method: 'POST',
  });
  const lombaData = await fetchDataLomba.json();
  const lombaLists = lombaData.data;
  console.log('lombaLists', lombaLists);

  const lombaField = document.getElementById('mata-lomba-field');
  let lombaListsField = '';
  // Membuat checkbox untuk setiap Mata Lomba
  for (const key in lombaLists) {
    const item = lombaLists[key];
    lombaListsField += `
    <div>
        <input class="checkbox" type="checkbox" name="mata-lomba" data-value="${item['lomba_id']}" id="${item['lomba_id']}" />
        <label for="${item['lomba_id']}">${item['nama_lomba']}</label>
    </div>

    `;
  }
  lombaField.innerHTML = lombaListsField;

  // SET SELECT PANGKALAN
  const fetchDataPangkalan = await fetch('/loadPangkalan', {
    method: 'POST',
  });
  const pangkalanData = await fetchDataPangkalan.json();
  const pangkalanLists = pangkalanData.data;
  console.log('pangkalanLists', pangkalanLists);

  const pangkalanField = document.getElementById('pangkalan-field');
  let pangkalanListsField = `<option value="">--- Pilih Pangkalan ---</option>`;
  for (const key in pangkalanLists) {
    const item = pangkalanLists[key];
    pangkalanListsField += `
      <option value="${item["id"]}">${item["nama_pangkalan"]}</option>
    `;
  }
  pangkalanField.innerHTML = pangkalanListsField;
  setPluginSelect2("#pangkalan-field");
}

function selectPeserta(el) {
  document.querySelectorAll('.participant-group').forEach(element => {
    if (element.classList.contains('active')) {
      element.classList.remove('active')
    }
    el.classList.add('active')
  });
}

async function setTokenPeserta() {
  try {
    openLoader(); // Open loader at the start
    const response = await fetch('/loadToken', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Error loading data');
    }

    const pesertaToken = await response.json();
    const dataToken = pesertaToken.data;  // Retrieve the data of token participants

    let contentTokenText = ``; // Initialize the content string for table rows
    let No = 1; // Start the number from 1
    for (let key in dataToken) {
      const peserta = dataToken[key]; // Corrected this to use dataToken instead of data

      contentTokenText += `
        <tr data-id="${peserta.id}">
          <td class="col-no">${No}</td>
          <td class="col-no-peserta">${peserta.no_peserta}</td>
          <td class="col-no-wa">${peserta.no_wa}</td>
          <td class="col-token">${peserta.token}</td>
          <td> 
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary" onclick="generateToken(this,${peserta.id})" title="Generate"><i class="bi bi-shuffle"></i></button>
              <button class="btn btn-outline-primary" onclick="saveTokenPeserta(this,${peserta.id})" title="Save"><i class="bi bi-save2"></i></button>
              <button class="btn btn-outline-success" onclick="sendToWhatsApp(this)" title="Kirim WA"><i class="bi bi-whatsapp"></i></button>
            </div>
          </td>
        </tr>`;
      No++; // Increment the number for each row
    }

    // Set the inner HTML of the table with the generated rows
    document.querySelector('#tabel-token-peserta tbody').innerHTML = contentTokenText;

  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    closeLoader(); // Close loader after all operations
  }
}


function showListToken(){
  openModal(modals[1])
  setTokenPeserta()
}

function generateToken(el) {
  length = 8
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';  // Huruf kapital + angka
  let token = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters[randomIndex];
  }

  el.closest('tr').querySelector('.col-token').textContent = token
  return token;
}

function saveTokenPeserta(el,id) {
  // Check if the user has permission to update
  if (!checkPrivileged('update', 'mst_peserta')) return false;

  // Get the values from the form fields
  let token = el.closest('tr').querySelector('.col-token').textContent;
  let tokenId = id  // ID token field (for update action)

  // Validate the inputs
  if (!token) {
    Swal.fire(
      'Hold on!',
      'Please input a token!',
      'warning',
    );
    return false;
  }

  // Display the token information to be updated
  let infoSwal = `<span>Token: <b>${token}</b></span><br>`;
  infoSwal += `<span>ID: <b>${tokenId}</b></span><br>`; // Display token ID for update action

  let iconSwal = `<i class="fa fa-plus"></i>`;
  iconSwal = `<i class="fas fa-pencil-alt"></i>`;  // Update icon when updating

  // Confirm the action with the user before submitting
  Swal.fire({
    title: "Hold on!",
    html: `Are you sure you want to save this token? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: `${iconSwal} Yes, save this!`,
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
  }).then((result) => {
    if (result.isConfirmed) {
      // Make AJAX request to save or update the token data
      $.ajax({
        url: 'saveTokenPeserta', // Ensure this is the correct backend endpoint
        type: 'POST',
        dataType: "JSON",
        data: {
          token: token,
          id: tokenId,   // Send token ID for the update action
        },
        beforeSend: function () {
          openLoader(); // Show loader before sending request
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully saved this token! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to save this token! <br><br>` + infoSwal
            });
          }
        },
        complete: function () {
          closeLoader();  // Close loader after request is completed
          setTokenPeserta()
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      // If the action is canceled
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancelled the save of this token! <br><br>` + infoSwal
      });
    }
  });
}

function sendToWhatsApp(el) {
  const row = el.closest('tr');
  const noPeserta = row.querySelector('.col-no-peserta')?.innerText.trim() || '-';
  const token = row.querySelector('.col-token')?.innerText.trim() || '-';
  const phone = row.querySelector('.col-no-wa')?.innerText.replace(/[^0-9]/g, '') || '';

  if (!phone) {
    alert("Nomor WhatsApp tidak tersedia.");
    return;
  }

  const message = `
Halo Kak!

Berikut adalah token untuk melihat hasil penilaian *Labschool Scout Competition 2025*:

🆔 No Peserta: ${noPeserta}
🔐 Token Nilai: ${token}

Silakan login terlebih dahulu ke website berikut:
🔗 https://labscoutitionsmp.integrarekap.com

Gunakan akun berikut:
👤 Username: guest  
🔑 Password: rekap@2025

Setelah berhasil login, masukkan token tersebut untuk melihat nilai lomba.

Terima kasih atas partisipasinya.  
Tim Rekapitulasi Labscoutition 2025
  `.trim();

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
}

function printExcelToken(el, tableName) {
  // CLONE TABEL YANG AKAN DICETAK
  const tableContent = $("#" + tableName).clone()
  const wrapTablePrint = $('#wrap-tabel-print table')
  const tableTbody = wrapTablePrint.find('tbody')
  const tableThead = wrapTablePrint.find('thead')

  // BERSIHKAN TABEL PRINT
  tableThead.empty()
  tableTbody.empty()

  // CLONE THEAD & TBODY
  const theadContent = tableContent.find("thead").clone()
  const tbodyContent = tableContent.find("tbody").clone()

  tbodyContent.find('.col-no-wa').prepend('`')
  tableThead.append(theadContent.children()) // hanya isi thead
  tableTbody.append(tbodyContent.children()) // hanya isi tbody

  // GAYA UNTUK TABEL EXPORT
  tableTbody.find('td').css({
    "vertical-align": "middle",
    "font-size": "16px"
  })

  tableTbody.find('.center-text').css({
    "text-align": "center"
  })

  wrapTablePrint.find('.no-border').css('border', '0')

  // EXPORT KE EXCEL
  const textNameFile = `Token List Peserta`
  exportToExcel(wrapTablePrint.attr('id'), textNameFile)
}