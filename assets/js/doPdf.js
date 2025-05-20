// General function to generate PDF from HTML
async function generateHtmlToPdf(boxId, options) {
  return new Promise((resolve, reject) => {
    var wrapId = boxId
    var sectionMainContent = document.querySelector('.content-wrap')
    if (sectionMainContent.querySelector('#report-print-temp')) {
      sectionMainContent.querySelector('#report-print-temp').remove()
    }
    sectionMainContent.insertAdjacentHTML('beforeend', '<section id="report-print-temp"></section>');

    $('.content-wrap .row-plugin').remove()
    $('.content-wrap').append(
      '<div class="row-plugin">' +
      '<script src="../../assets/plugins/html2canvas/html2canvas-1-4-1.min.js"></script>' +
      '<script src="../../assets/plugins/jspdf/jspdf-2-5-1.umd.min.js"></script>' +
      '</div>'
    )

    pdfWidth = options.pdfWidth
    pdfHeight = options.pdfHeight
    canvasType = options.canvasType
    fileType = options.fileType
    fileName = options.fileName
    canvasName = options.canvasName
    cssOptions = options.cssOptions

    var countPage = document.querySelectorAll('#' + wrapId + ' .canvas-content').length

    document.getElementById('report-print-temp').innerHTML = ''
    new Promise(function (resolve, reject) {
      document.querySelectorAll('#' + boxId + ' .canvas-content').forEach(function (canvas) {
        var clonedCanvas = canvas.cloneNode(true)
        document.getElementById('report-print-temp').appendChild(clonedCanvas)
      })
      resolve('ok')
    }).then(async function () {
      document.querySelectorAll('#report-print-temp .canvas-content').forEach(function (canvas, index) {
        var pageNo = index + 1
        canvas.setAttribute('id', canvasName + pageNo)
      })

      await applyStyles($('#report-print-temp'), cssOptions)

      await generateMultiplePDF(pdfWidth, pdfHeight, canvasName, canvasType, countPage, fileType, fileName).then(function () {
        $('.row-plugin').remove()
        resolve('ok')
      })
    })
  })
}

// Function to apply styles to elements PDF --
async function applyStyles(container, styles) {
  return new Promise((resolve, reject) => {
    for (var selector in styles) {
      if (styles.hasOwnProperty(selector)) {
        container.find(selector).css(styles[selector])
      }
    }
    resolve('ok')
  })
}

// Ganerate Print PDF Function --
async function generateMultiplePDF(pdfWidth, pdfHeight, canvasName, canvasType, countPage, fileType, fileName) {
  return new Promise(async (resolve, reject) => {
    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF(canvasType, 'px', [pdfWidth, pdfHeight]);

      for (let i = 0; i < countPage; i++) {
        if (i > 0) {
          doc.addPage();
        }
        const pageElement = document.getElementById(`${canvasName}${i + 1}`);
        const yPosition = i * pdfHeight
        if (pageElement) {
          await doc.html(pageElement, {
            x: 0,
            y: yPosition
          });
        }
      }

      if (fileType == 'filePdf') {
        doc.save(`${fileName}.pdf`);
      } else if (fileType == 'fileTab') {
        window.open(doc.output('bloburl'));
      }

      resolve('ok');
    } catch (error) {
      reject(error);
    }
  });
}

function closeModalAndPreviewPrint(el) {
  closeModal()
  el.closest('.modal').removeAttribute('style')
}

