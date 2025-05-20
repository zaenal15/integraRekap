$(document).ready(function() {
  $('input').keypress(function(event){
    keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
      goLogin()   
    }
    event.stopPropagation();
  })

  isTimeoutSession = document.querySelector('#isTimeoutSession').value
  if(isTimeoutSession == "yes"){
    Swal.fire(
      "Session ended!",
      "Your session is automatically ended for being idle for <b>30</b> minutes. Please login to get back.",
      "info",
    )
  }
  
  if(isTimeoutSession == "no"){
    Swal.fire(
      "Logged Out!",
      "Successfully logged out!",
      "success",
    )
  }

  document.querySelectorAll('.form-input, .form-input *').forEach(form => {
    form.onclick = function() { form.closest('.form-input').querySelector('input, select, textarea').focus() }
  })
})

// GO LOGIN --ir
function goLogin(guest) {
  username = document.querySelector('#user-name').value
  password = document.querySelector('#user-pass').value
  token = document.querySelector('#token').value

  if(!username && !guest){
    Swal.fire(
      'Hold on!',
      'Please input username / email first!',
      'warning',
    )
    return
  }

  if(!password && !guest){
    Swal.fire(
      'Hold on!',
      'Please input password first!',
      'warning',
    )
    return
  }
  
  $.ajax({
    url : "checkLogin",
    type : "POST",
    data : {
      username : username,
      password : password,
      token : token,
      guest: guest
    },
    beforeSend: function() {
      document.querySelector('#btn-login').innerHTML = "Please Wait..."
      document.querySelector('#btn-login').style.pointerEvents = 'none'
    }, success: function(data) {
     if(data == 'success') window.location.href = window.location.href + '/erekap'
     else if(data == "token"){
      Swal.fire(
        "Token not valid!",
        "Please reload",
        "info",
      )
     }
     else if(data == "not-found"){
      Swal.fire(
        "This email / username did not exist!",
        "Please select another username / email!",
        "warning",
      )
     }
     else if(data == "user"){
      Swal.fire(
        "This email / username are not active!",
        "Please select another username / email!",
        "warning",
      )
     }
     else if(data.includes('block')){
      attemptsCount = data.split('-')[1]
      Swal.fire(
        `Username / email ${username} are blocked!`,
        `You have tried ${attemptsCount} times with the wrong password. Please contact admin for recovery.`,
        "warning",
      )
     }
     else if(data.includes('password')){
      attemptsCount = data.split('-')[1]
      remainingCount = 5 - attemptsCount
      Swal.fire(
        "Password are not correct!",
        `Please input valid password. <br> <b>Remaining ${remainingCount} attemp(s).</b> <br> <i>Failed attempt counter will be reset after 2 days.</i>`,
        "error",
      )
     }
    }, complete: function(){
      document.querySelector('#btn-login').innerHTML = "Login"
      document.querySelector('#btn-login').style.pointerEvents = 'unset'
    }
  })
}
