console.log("script.js oké");

(function ($) {
    $(document).ready(function () {

        var $s = function (sel) {
            return document.querySelector(sel);
        };

        var $sa = function (sel) {
            return document.querySelectorAll(sel);
        };

        var stylists = [];

        var oneStylist = [];

        var editedId = null;

        var stylistsRes = [];

        var requests = {

            createXHTTP: function (cbFn) {
                var xhttp = new XMLHttpRequest();

                xhttp.onreadystatechange = function () {

                    if (this.readyState == 4 && this.status == 200)
                        cbFn(this.responseText);
                }

                return xhttp;
            },

            get: function (url, cbFn) {
                var xhttp = requests.createXHTTP(cbFn);

                xhttp.open("GET", url);

                xhttp.send();
            },

            post: function(o){
                o = Object.assign({
                    success: function(){},
                    params: {}
                }, o);
            
                var xhttp = requests.createXHTTP(o.success);
            
                xhttp.open("POST", o.url);
                xhttp.setRequestHeader("Content-type", "application/json");
                xhttp.send(JSON.stringify(o.params));
            },

            stylist: function () {

                renderStylists(oneStylist);
                $s(".stylist-ct").classList.add("onestylist");
            },

            load: function () {

                requests.get("/stylists", (res) => {

                    stylists = JSON.parse(res);

                    renderStylists(stylists);

                })

            },

            adminLoad: function () {

                requests.get("/admin", (res) => {

                    stylistsRes = JSON.parse(res);

                    renderReservations(stylistsRes);
                })
            }

        }

        requests.load();

        var stylistTPL = (styl) => `
            <div class="stylist-ct" data-id="${styl._id}">
                <img class="stylist-img" src="${styl.img}" alt="${styl.neve}">
                <div class="inner-ct"> 
                    <div class="myname">${styl.neve}</div>
                    <div class="aboutme">${styl.bemutatkozas}</div>
                </div>
                <div id="work">
                    <div>
                        <div>Az alábbi napokon és időintervallumokban dolgozom:</div>
                        <br>
                        <div class="workhours"></div>
                    </div>
                </div>
                <div id="reserve">Időpontfoglalás</div>
                <div id="back">Vissza</div>
               
            </div>
        `;

        var workhoursTPL = (styl) => `
    
            <div>${styl.nap}: ${styl.tol} - ${styl.ig}</div>
    
        `;

        var reserveHoursTPL = (hours) => `
            <input type="radio" id="hour-${hours}" class="radio-btn" name="rHours" value="${hours}">
            <label for="hour-${hours}">${hours}</label>
            <br>
        `;

        var reservedTPL = (reservations) => `
        
            <div class="r-stylist-ct" data-id="${reservations._id}">
                <img class="stylist-img" src="${reservations.img}" alt="${reservations.neve}">
                <div class="myname">${reservations.neve}</div>
                <div class="r-inner-ct"> 
                </div>
            </div>
        `;

        var reserversTPL = (rNameTime) => `
        
        <div class="r-time" data-ora="${rNameTime.ora}">${rNameTime.ora} óra: ${rNameTime.nev}</div>
            
        `;

        var byId = (id) =>
            stylists.find(p => p._id === id)


        function renderStylists(stylists) {

            var stylistDiv = $s("#stylists");

            stylistDiv.innerHTML = "";
            
            var rDiv = $s("#r-container");

            rDiv.innerHTML = "";

            for (let styl of stylists) {
                stylistDiv.innerHTML += stylistTPL(styl);
            }

            $sa(".stylist-ct").forEach(sBox => {

                var stylist = byId(sBox.dataset.id);

                var pDateStr = "";

                sBox.querySelector("#reserve").onclick = function () {

                    oneStylist.push(stylist);

                    requests.stylist();

                    var workhoursDiv = $s(".workhours") || "";

                    workhoursDiv.innerHTML = "";

                    for (let ny in stylist.nyitvatartas) {

                        workhoursDiv.innerHTML += workhoursTPL(stylist.nyitvatartas[ny]);
                    }

                    editedId = sBox.dataset.id;

                    oneStylist = [];
                    
                    $s("#reserve").style.display = "none";
                    $s("#back").style.display = "inline-block";
                    $s("#apply").style.display = "inline-block";
                    $s("#work").style.display = "block";
                    $s("#res-container").style.display = "block";
                    
                };
                
                $s(".picker1").onchange = function () {
                    
                    var reserveDiv = $s("#rendered-hours");

                    reserveDiv.style.display = "block";
                    
                    var pDate = new Date($s(".picker1").value);

                    var pickedYear = pDate.getFullYear().toString();
                    var pickedMonth = (pDate.getMonth()+1).toString();
                    var pickedDate = pDate.getDate().toString();

                    pDateStr = pickedYear.concat("-", pickedMonth, "-", pickedDate);

                    reserveDiv.innerHTML = `
                        <div>A kiválasztott napon az alábbi időpontokban dolgozom:</div>
                    `;

                    for( let dayHour in stylist.nyitvatartas){

                        if(pDate.getDay() == stylist.nyitvatartas[dayHour].napIndex){
                            
                            for (let h = (stylist.nyitvatartas[dayHour].tol)-1; h < (stylist.nyitvatartas[dayHour].ig)-1; h++){

                                reserveDiv.innerHTML += reserveHoursTPL(parseInt(h+1));
                                
                                for (let i in stylist.idopontfoglalas){

                                    if(stylist.idopontfoglalas[i].datum == pDateStr && stylist.idopontfoglalas[i].ora == h+1){

                                        $s(`#hour-${h+1}`).disabled = true;
                                        
                                        $s(`label[for="hour-${h+1}"]`).innerHTML += " : Ez az időpont már foglalt.";

                                    }
                                }
                            }
    
                        } 
                    }
                    
                };

                $s("#apply").onclick = function () {

                    var nev = $s("#name").value.trim();

                    var datum = pDateStr;

                    var ora = "";

                    var rdioBtns = $sa('input[name="rHours"]');

                    for (let rBtn of rdioBtns)
                        if (rBtn.checked)
                            ora = parseInt(rBtn.value);

                    if ( nev !== "" && datum !== "" && ora !== ""){
                        requests.post({
                            url: '/newreservation',
                            params: {
                                nev,
                                datum,
                                ora,
                                _id: editedId
                            },
                            success: (res) => {
                                alert("Az időpontfoglalás megtörtént.");
                                $s("#back").onclick();

                                $s("#name").value = "";
                                $s(".picker1").value = "év-hó-nap";
                                $s("#rendered-hours").innerHTML = "";
                                
                            }
                        })
                    } else
                        alert("Minden mezőt kötelező kitölteni!");
                }

                $s("#admin").onclick = function () {
                    requests.adminLoad();
                    $s("#admin-btns").innerHTML += `<div id="back">Vissza</div>`;
                    $s("#back").style.display = "inline-block";
                    $s("#r-container").style.display = "flex";
                }
            });

            $s("#back").onclick = function () {
                requests.load();
                
                $s("#name").value = "";
                $s(".picker1").value = "év-hó-nap";
                $s("#rendered-hours").innerHTML = "";
                $s("#apply").style.display = "none";
                $s("#work").style.display = "none";
                $s("#res-container").style.display = "none";
                $s("#back").style.display = "none";
            };

        }

        function renderReservations(reservations) {

            var rDiv = $s("#r-container");

            rDiv.innerHTML = "";

            var stylistDiv = $s("#stylists");

            stylistDiv.innerHTML = "";

            $s("#apply").style.display = "none";
            if($s("#work"))$s("#work").style.display = "none";
            $s("#res-container").style.display = "none";
            $s("#picker2").style.display = "inline-block";

            for (let styl of stylists) {
                rDiv.innerHTML += reservedTPL(styl);
            }

            $s(".picker2").onchange = function () {

                $sa(".r-stylist-ct").forEach(rBox => {

                    var stylist = byId(rBox.dataset.id);

                    var rTimeDiv = rBox.querySelector(".r-inner-ct");

                    rTimeDiv.innerHTML = "";

                    var resDate = new Date($s(".picker2").value);

                    var rYear = resDate.getFullYear().toString();
                    var rMonth = (resDate.getMonth()+1).toString();
                    var rDate = resDate.getDate().toString();

                    rDateStr = rYear.concat("-", rMonth, "-", rDate);

                    var reservated = [];

                    for(let i in stylist.idopontfoglalas){
                        
                        if(stylist.idopontfoglalas[i].datum == rDateStr){
                            
                            reservated.push(stylist.idopontfoglalas[i]);
                            
                        }
                    }
                    
                    reservated.sort((a,b) => a.ora - b.ora);

                    for(let r in reservated){
                        rTimeDiv.innerHTML += reserversTPL(reservated[r]);
                    }
                })
            }

            $s("#back").onclick = function () {
                requests.load();
                
                $s("#name").value = "";
                $s(".picker1").value = "év-hó-nap";
                $s(".picker2").value = "év-hó-nap";
                $s("#rendered-hours").innerHTML = "";
                $s("#apply").style.display = "none";
                $s("#picker2").style.display = "none";
                if($s("#work"))$s("#work").style.display = "none";
                $s("#res-container").style.display = "none";
                $s("#back").style.display = "none";
            };
        }

        $.datepicker.setDefaults({
            minDate: 0,
            maxDate: "+3M",
            dateFormat: "yy-mm-dd",
            monthNames: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
            dayNames: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"],
            dayNamesMin: ["Vas", "Hét", "Ke", "Sze", "Csüt", "Pén", "Szo"],
            showMonthAfterYear: true,
            firstDay: 1
        });

        $(".picker1").datepicker();

        $(".picker2").datepicker();
        
    });

})(jQuery);

