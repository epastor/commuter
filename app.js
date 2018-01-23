$( document ).ready(function() {

  function timeToMilliseconds(hrs,min,sec){
    return((hrs*60*60+min*60+sec)*1000);
  }

  function getMillisecondsFromTimeString(time){
    return timeToMilliseconds(parseInt(time.split(":")[0]),parseInt(time.split(":")[1]), 0);
  }

  function getHoursMinutesSecondsFromTime(time){
    var seconds = time / 1000
    var minutes = seconds / 60
    var hours   = minutes / 60

    seconds = (Math.ceil(minutes)%minutes) * 60
    minutes = (Math.ceil(hours)%hours) * 60
    hours = Math.floor(hours)

    return {hours, minutes, seconds}
  }

  function millisecondsToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes;
  }

  function initTimePicker(timePickerId, defaultTime){
    $(timePickerId).pickatime({
      default: defaultTime, // Set default time: 'now', '1:30AM', '16:30'
      twelvehour: false, // Use AM/PM or 24-hour format
      donetext: 'OK', // text for done-button
      cleartext: 'Clear', // text for clear-button
      canceltext: 'Cancel', // Text for cancel-button
      autoclose: false, // automatic close timepicker
      ampmclickable: true, // make AM PM clickable
      aftershow: function(){} //Function for after opening timepicker
    });
  }

  function calculateDrivingTimesForTimeRange(startTime, endTime, origin, destination, increment, resultEl){
    $(resultEl).html("")
    $(resultEl + " .active").removeClass("active")

    var shortestDrive = null

    var service = new google.maps.DistanceMatrixService();
    for(let i = startTime; i <= endTime; i = i + increment){
      let {hours, minutes, seconds} = getHoursMinutesSecondsFromTime(i)
      var driveTime = new Date();
      driveTime.setHours(24 + Math.floor(hours),minutes,0,0);
      console.log(driveTime)

      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: 'DRIVING',
          avoidHighways: false,
          avoidTolls: false,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
          drivingOptions: {
            departureTime:driveTime,
            trafficModel: 'bestguess'
          }
        }, function callback(response, status) {
          if (status == 'OK') {
            $("#results").removeClass("hide")
            $(resultEl).append( "<li id='"+i+"' class='collection-item' data-departure-time='"+i+"' data-arrival-time='"+response.rows[0].elements[0].duration_in_traffic.value+"'>Leave at "+millisecondsToTime(i)+", drive will be "+response.rows[0].elements[0].duration_in_traffic.text+"</li>" )

            $(resultEl).sort(function (a, b) {
              var contentA =parseInt( $(a).data('departure-time'));
              var contentB =parseInt( $(b).data('departure-time'));
              return (contentA < contentB) ? -1 : (contentA > contentB) ? 1 : 0;
            })

            if(shortestDrive == null){
              $("#" + i).addClass("active");
              shortestDrive = response.rows[0].elements[0].duration_in_traffic.value
            }else if(response.rows[0].elements[0].duration_in_traffic.value < shortestDrive){
              $(resultEl + " .active").removeClass("active")
              $("#" + i).addClass("active");
              shortestDrive = response.rows[0].elements[0].duration_in_traffic.value
            }else if(response.rows[0].elements[0].duration_in_traffic.value == shortestDrive){
              $("#" + i).addClass("active");
            }

            console.log(response)
          }
        });
    }
  }

  $("#btnCalculate").on("click", function(){

      msTime1a = getMillisecondsFromTimeString( $('#departureTime1a').val() );
      msTime1b = getMillisecondsFromTimeString( $('#departureTime1b').val() );
      msTime2a = getMillisecondsFromTimeString( $('#departureTime2a').val() );
      msTime2b = getMillisecondsFromTimeString( $('#departureTime2b').val() );

      var origin      = $("#txtHome").val()
      var destination = $("#txtWork").val()
      var increment   = (15*60*1000) //15 Minutes * 60seconds * 1000 milliseconds


      calculateDrivingTimesForTimeRange(msTime1a, msTime1b, origin, destination, increment, "#morningTimes");
      calculateDrivingTimesForTimeRange(msTime2a, msTime2b, destination, origin, increment, "#afternoonTimes");


    });

    initTimePicker('#departureTime1a', '07:30');
    initTimePicker('#departureTime1b', '08:30');
    initTimePicker('#departureTime2a', '16:30');
    initTimePicker('#departureTime2b', '18:00');

});
