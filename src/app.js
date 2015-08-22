// Version 0.94

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var sentidoLinea;

// Función que obtiene las lineas de autobús

var lineastram = function(data){
    var items = [];
    console.log("Ha llegado hasta aqui");
    for(var i = 0; i < data.totalCount; i++){
        var linea = data.result[i];
        var poste = linea.id;
        console.log("Saca el ID de Result. Linea:" + linea);
        var parada = linea.title;
        console.log("Parada:" + parada);
        var proximosTranvias = [];
        // Siguen circulando los tranvias? Entonces hay destinos...
        if(linea.destinos){
            for (var j = 0; j < linea.destinos.length; j++){
            proximosTranvias.push(linea.destinos[j].minutos);
            console.log("Siguiente tranvia en: " + proximosTranvias + "m");
            }
        }     
        //¿Es valida, segun la direccion de la linea?
        if((sentidoLinea == "Avda Academia" && poste%2 === 0) || (sentidoLinea == "Mago De Oz" && poste%2 == 1)) {
            items.push({title:parada,subtitle:poste,data:proximosTranvias});
            console.log("El array introducido es de " + proximosTranvias.length);
        }
    }
    // Devuelve las lineas ordenadas en un array.
    return items;
};    

var lineasbus = function(data){
    var items = [];
    console.log("Ha llegado hasta aqui");
    for(var i = 0; i < data.totalCount; i++){
        var linea = data.result[i];
        linea = linea.substring(86,linea.length);
        console.log("Linea detectada: " + linea);
        //Lineas que NO pertenecen a TUZSA: 1 y las de más de 3 dígitos.
        if(linea.length>1 && linea.length < 4){
            console.log("Linea " + linea + " es valida");
            items.push({title:linea});
        }
    }    
  // Devuelve las lineas ordenadas en un array.
  return items;
};

var lineasbizi = function(data){
    var items = [];
    console.log("Comienza a analizar las lineas");
    for(var i=0;i < data.totalCount; i++){
        var parada = data.result[i];
        var id = parada.id;
        console.log("Parada encontrada: n" + id);
        var dir = parada.title;
        var state = parada.estado;
        var bicis = parada.bicisDisponibles;
        var huecos = parada.anclajesDisponibles;
        items.push({subtitle:dir, title:id, estado:state, bicis:bicis, huecos:huecos});
    }
    return items;
};

var ordenarLineas = function(array){
    // Orden para priorizar: Primero circulares, después numéricas, después lanzaderas. 
    // ¡IDEA! De noche, mostrar SOLO las nocturnas!
    var newArray = [];
    console.log("Creo Array");
    var d = new Date();
    // DESCOMENTAR PARA PROBAR LAS LINEAS NOCTURNAS!
    // d.setHours(2);
    if((d.getHours() > 5) || (d.getHours() == 5 && d.getMinutes() > 45) || (d.getHours() === 0 && d.getMinutes() < 50)){
        // Si son mas de las 5:45 o menos de las 0:50... HORARIO DIURNO.
        console.log("Estamos en Horario Diurno.");
        // Primero Circulares.
        for(var i=0; i<array.length; i++){
            if(array[i].title.indexOf("CI")!=-1){
                // Detectado un Circular. Pasarlo al array.
                if(array[i].title.toString()=="CI1"){newArray.push({title:array[i].title.toString(),icon:"images/ClockArrow.png"});}
                if(array[i].title.toString()=="CI2"){newArray.push({title:array[i].title.toString(),icon:"images/AntiClockArrow.png"});}
            }
        }
        // Ahora, los numericos. EN ORDEN.
        var anteriorPeque = 0; //Bus pequeño en la anterior ronda.
        var actualPeque; //Bus pequeño en la actual ronda.
        do{
            actualPeque = 999; //
            for(i=0; i<array.length; i++){
                if(!isNaN(Number(array[i].title))){
                    // Se ha encontrado un numero. ¿Este ha aparecido antes?
                    if(Number(array[i].title)<actualPeque && Number(array[i].title)>anteriorPeque){
                        //Es mas pequeño que el Actual... y mas grande que el anterior Peque. NUEVO BUS PEQUEÑO.
                        actualPeque = Number(array[i].title);
                    }
                }
            }
            // Se ha llegado al más pequeño. ¿Es 999?
            if(actualPeque!=999){
                //Hay uno nuevo para añadir.
                anteriorPeque = actualPeque;
                newArray.push({title:actualPeque.toString(),icon:"images/UpDownArrow.png"});
            }
        }while(actualPeque!=999);
        // Ordenados los numericos. Ahora, las lanzaderas...
        for(i=0; i<array.length; i++){
            if(array[i].title.indexOf("C")!=-1 && array[i].title.length == 2){
                // Detectado una Lanzadera. Pasarla al array.
                newArray.push({title:array[i].title.toString(),icon:"images/UpDownArrow.png"});
            }
        }
    } else {
        // Si son entre las 0:50 y las 5:45... HORARIO NOCTURNO.
        console.log("Estamos en Horario Nocturno. Hora:" + d.getHours() + ":" + d.getMinutes());
        for(var j=0; j<array.length; j++){
            if(array[j].title.indexOf("N")!=-1 && array[j].title != "PN"){ // La linea PN es la linea al Parking Norte. ANULARLA.
                // Detectada una Lanzadera. Pasarla al array.
                newArray.push({title:array[j].title.toString()});
            }
        }
    }
    console.log(d + " es la fecha actual. Hora:" + d.getHours());
    return newArray;
};

var ordenarBizis = function(data){
    data.sort(function(a, b) {return parseFloat(a.title) - parseFloat(b.title);});
    console.log("Array ordenado");
    return data;
};
// Función que ordena el array de tranvías
var ordenarParadas = function(array,orden) {
    var posicion;
    var j = 0;
    var poste = 0;
    var actual = [];
    var i;
    if (orden == "a") { // Ordenar de manera ascendente (1 es el primero, 25 el último)
        while (j < array.length-1) { //Mientras J sea menor que el ArrayLength, queda recorrido por hacer.
            for (i = (array.length-1 -j); i >= 0; i--) { // Un recorrido completo para quedarse con el mas pesado de todos.
                if(poste < Number(array[i].subtitle)) {
                    poste = Number(array[i].subtitle); // en Poste, el número de poste que se ha quedado
                    posicion = i; //en posición, la posición del Array.
                }
            }
            //Se ha llegado al final completo. Sustituir el de posicion por el ultimo...
            actual = array[posicion];
            array[posicion] = array[(array.length-1) - j]; //Ha de tratar el último... sin tocar los ya tocados. J.
            array[(array.length-1) - j] = actual;
            j++;
            poste = 0;
        }
    }
    if (orden == "d") { // Ordenar de manera descendente (25 es el primero, 1 el último)
        poste = 9999;
        while (j < array.length-1) { //Mientras J sea menor que el ArrayLength, queda recorrido por hacer.
            for (i = (array.length-1)-j; i >= 0; i--) { // Un recorrido completo para quedarse con el mas ligero de todos.
                if(poste > Number(array[i].subtitle)) {
                    poste = Number(array[i].subtitle); // en Poste, el número de poste que se ha quedado
                    posicion = i; //en posición, la posición del Array.
                }
            }
            //Se ha llegado al final completo. Sustituir el de posicion por el ultimo...
            actual = array[posicion];
            array[posicion] = array[(array.length - 1) - j];
            array[(array.length - 1) - j] = actual;
            j++;
            poste = 9999;
        }
    }
    return array;
};

// Funcion que coge la información util del Array de linea de bus. OJO: USO EL METODO DE DNDZGZ Y NO EL DEL AYTO. Filtrar.
 var obtenerParadasBus = function(array,linea){
    var returnArray = [];
    console.log("Llega a Ordenar paradas.");
    for(var i = 0; i < array.length; i++){
        if(array[i].lines){
            //console.log("Ha encontrado lineas en este poste.");
            for(var j = 0; j < array[i].lines.length; j++){
                //console.log("Linea " + array[i].lines[j]);
                if(array[i].lines[j] == linea){
                    //La linea que se busca es la que se ha encontrado!
                    var poste = array[i].id;
                    var parada = array[i].title;
                    //console.log("Parada: " + parada + ", poste: " + poste);
                    returnArray.push({title:parada,subtitle:poste,lat:array[i].lat,lon:array[i].lon});
                }
            }
        }
    }
     
    return returnArray;
 };

var showInfoBus = function(dataPoste) {
    // Analizando el json de poste... hay que modificar el título.
    console.log("Detecta lo de Línea en " + dataPoste.title.search("Línea"));
    var poste = dataPoste.title.slice(dataPoste.title.indexOf("(")+1,dataPoste.title.indexOf(")"));
    console.log("Poste: " + poste);
    dataPoste.title = dataPoste.title.slice(dataPoste.title.indexOf(")")+1,dataPoste.title.search("Línea"));
    console.log("Nuevo título:" + dataPoste.title);
    var posteCard = new UI.Card({title: dataPoste.title.toString(), subtitle: poste, scrollable: true, style: "small"});
    // Creada la tarjeta, con título nombre de la parada y subtítulo, numero de poste.
    // Ahora, a meter la información...
    var body = ""; // Cadena vacía por seguridad.
    if(dataPoste.destinos){
        console.log("Ha detectado destinos");
        // Hay buses aún pendientes.
        for(var n=0; n<dataPoste.destinos.length; n++){
            // Primero se presenta la linea.
            console.log("Entra a comprobar destinos");
            body = body + "Línea " + dataPoste.destinos[n].linea + ", Dirección " + dataPoste.destinos[n].destino;
            // Despues, el primer bus.
            body = body + "\n - " + dataPoste.destinos[n].primero + '\n';
            // Si hay un segundo bus, se muestra.
            if(dataPoste.destinos[n].segundo){
                body = body + " - " + dataPoste.destinos[n].segundo + '\n';
            }                      
        }
    }else{
        // Ya no queda ningún por pasar.
        body = "No hay más buses en esta parada.";
    }
    // Una vez metidos todos los datos, mostramos la tarjeta,
    console.log("Mensaje: " + body);
    posteCard.body(body);
    return posteCard;
};

var showInfoTram = function(data,dir){
    console.log("Saca el ID de Result. Linea:" + data.id);
    console.log("Parada:" + data.title);
    var proximosTranvias = [];
    // Siguen circulando los tranvias? Entonces hay destinos...
    if(data.destinos){
        for (var j = 0; j < data.destinos.length; j++){
            proximosTranvias.push(data.destinos[j].minutos);
            console.log("Siguiente tranvia en: " + proximosTranvias[j] + "m");
        }
    }     
    // Todo gestionado en el array. Ahora, a hacer aparecer en la ventana.
    var info = " Proximo tranvia en: \n ";
    if (proximosTranvias.length > 0) {
        for(var i = 0; i < proximosTranvias.length; i++) {
            info = info + proximosTranvias[i] + "m,  ";                   
        }
    } else {
        info = "No hay tranvias.";
    }
    var detailCard = new UI.Card({
        title: data.title,
        subtitle: "Dir. " + dir,
        body: info + " \n \n Parada " + data.id,
        style: "small",
    });
    return detailCard;
};

var showInfoBizi = function(data) {
    var estado;
    if (data.estado == "OPN") {estado = "Operativa";} else {estado = "Cerrada";}
    var detailCard = new UI.Card({
        title: "Poste " + data.title,
        subtitle: estado,
        body: data.subtitle + "\n  Nº Bicis: " + data.bicis + " \n  Anclajes libres: " + data.huecos,
        style: "small",
        scrollable: true,
    });
    console.log("Lista la tarjeta de informacion");
    return detailCard;
};

var showInfoBizi2 = function(data) {
        var estado;
    if (data.estado == "OPN") {estado = "Operativa";} else {estado = "Cerrada";}
    var detailCard = new UI.Card({
        title: "Poste " + data.id,
        subtitle: estado,
        body: data.title + "\n  Nº Bicis: " + data.bicisDisponibles + " \n  Anclajes libres: " + data.anclajesDisponibles,
        style: "small",
        scrollable: true,
    });
    console.log("Lista la tarjeta de informacion");
    return detailCard;
};

var loadVentanaFav = function(){
    console.log("Entra en loadVentanaFav");
    var ventana = new UI.Card({
        action: {
            up: 'images/Tick.png',
            down: 'images/x.png'
        },
        body: "¿Deseas guardar esta parada como favorita?"
    });
    return ventana;
};

var loadDeleteFav = function(){
    console.log("Entra en loadDeleteFav");
    var ventana = new UI.Card({
        action: {
            up: 'images/Tick.png',
            down: 'images/x.png'
        },
        body: "¿Deseas eliminar esta parada como favorita?"
    });
    return ventana;
};

var newBusFav = function(poste,title){
    var favBus = localStorage.getItem("storedFavBus");
    console.log("Creando nuevo favorito.");
    if(!favBus){
        favBus = [];
    } else {
        favBus = JSON.parse(favBus);
    }
    //Hay que comprobar que la parada no exista ya.
    var existe = false;
    var i = 0;
    while(i<favBus.length){
        if(favBus[i].id == poste){
            existe = true;
        }
        i++;
    }
    console.log("¿Existe ya la parada en el array?" + existe);
    // Si no existe parada, hay que añadirla.
    if(!existe){
        console.log("Tamaño del array: " + favBus.length);
        console.log("Nombre: " + title + "; id: " + poste);
        favBus.push({nombre: title, id: poste});
        console.log("Guardado en el array. Ahora es de tamaño " + favBus.length);
        console.log("Nombre: " + favBus[favBus.length-1].nombre + "; ID: " + favBus[favBus.length-1].id);
        localStorage.setItem("storedFavBus", JSON.stringify(favBus));
        console.log("Teoricamente guardado. Compruebo.");
        // COMPROBACION. ¿Lo ha hecho bien?
        favBus = JSON.parse(localStorage.getItem("storedFavBus"));
        console.log("Tamaño del array: " + favBus.length);
        console.log("FUNCION TERMINADA");
    }
};

var newTramFav = function(poste,title,direccion){
    var favTram = localStorage.getItem("storedFavTram");
    console.log("Creando nuevo favorito.");
    if(!favTram){
        favTram = [];
    } else {
        favTram = JSON.parse(favTram);
    }
    var existe = false;
    var i = 0;
    while(i<favTram.length){
        if(favTram[i].id == poste){
            existe = true;
        }
        i++;
    }
    console.log("¿Existe ya la parada en el array?" + existe);
    if(!existe){
        console.log("Tamaño del array: " + favTram.length);
        console.log("Nombre: " + title + "; id: " + poste + "; direccion: " + direccion);
        favTram.push({nombre: title, id: poste, dir: direccion});
        console.log("Guardado en el array. Ahora es de tamaño " + favTram.length);
        console.log("Nombre: " + favTram[favTram.length-1].nombre + "; ID: " + favTram[favTram.length-1].id + "; dir: " + direccion);
        // TO-DO: QUE COMPRUEBE SI ESTA PARADA YA EXISTE.
        localStorage.setItem("storedFavTram", JSON.stringify(favTram));
        console.log("Teoricamente guardado. Compruebo.");
        // COMPROBACION. ¿Lo ha hecho bien?
        favTram = JSON.parse(localStorage.getItem("storedFavTram"));
        console.log("Tamaño del array: " + favTram.length);
        console.log("FUNCION TERMINADA");
    }
};

var newBiziFav = function(poste,direccion){
    var favBizi = localStorage.getItem("storedFavBizi");
    console.log("Creando nuevo favorito.");
    if(!favBizi){
        favBizi = [];
    } else {
        favBizi = JSON.parse(favBizi);
    }
    var existe = false;
    var i = 0;
    while(i<favBizi.length){
        if(favBizi[i].id == poste){
            existe = true;
        }
        i++;
    }
    console.log("¿Existe ya el poste en el array?" + existe);
    if(!existe){
        favBizi.push({nombre: direccion, id: poste});
        localStorage.setItem("storedFavBizi", JSON.stringify(favBizi));
    }
};

var deleteTramFav = function(poste){
    var favTram = localStorage.getItem("storedFavTram");
    if(!favTram){
        favTram = [];
    } else {
        favTram = JSON.parse(favTram);
        var i = 0;
        while(i<favTram.length){
            if(favTram[i].id == poste){
                //Ha encontrado el ID a quitar!
                favTram.splice(i,1);
                console.log("Elemento hallado y quitado");
            }
        i++;
        }
    }
    localStorage.setItem("storedFavTram",JSON.stringify(favTram));
};

var deleteBusFav = function(poste){
    var favBus = localStorage.getItem("storedFavBus");
    if(!favBus){
        favBus = [];
    } else {
        favBus = JSON.parse(favBus);
        var i = 0;
        while(i<favBus.length){
            if(favBus[i].id == poste){
                //Ha encontrado el ID a quitar!
                favBus.splice(i,1);
                console.log("Elemento hallado y quitado");
            }
        i++;
        }
    }
    localStorage.setItem("storedFavBus",JSON.stringify(favBus));
};

var deleteBiziFav = function(poste){
  var favBizi = localStorage.getItem("storedFavBizi");
    if(!favBizi){
        favBizi = [];
    } else {
        favBizi = JSON.parse(favBizi);
        var i = 0;
        console.log("Numero de postes:" + favBizi.length);
        while(i<favBizi.length){
            if(favBizi[i].id == poste){
                //Ha encontrado el ID a quitar!
                favBizi.splice(i,1);
                console.log("Elemento hallado y quitado");
            }
        i++;
        }
        console.log("Numero actual de postes:" + favBizi.length);
    }
    localStorage.setItem("storedFavBizi",JSON.stringify(favBizi));  
};

var loadMenuFav = function(){
    var favTram = JSON.parse(localStorage.getItem("storedFavTram"));
    var favBus = JSON.parse(localStorage.getItem("storedFavBus"));
    var favBizi = JSON.parse(localStorage.getItem("storedFavBizi"));
    var menuFav = [];
    var i;
    if(favTram){ //Se ha inicializado al menos una vez. ¡Pasemos al menu!
        for(i=0;i<favTram.length;i++){
            console.log("cadena: " + favTram[i] + "; nombre: " + favTram[i].nombre + "; id: " + favTram[i].id + "; dir: "+ favTram[i].dir);
            menuFav.push({title: favTram[i].nombre, subtitle: favTram[i].id, icon: "images/tram.png", direccion: favTram[i].dir});
        }
    }
    if(favBus){ //Se ha inicializaco al menos una vez.
        for(i=0;i<favBus.length;i++){
            console.log("cadena: " + favBus[i]);
            console.log("nombre: " + favBus[i].nombre);
            console.log("id: " + favBus[i].id);
            menuFav.push({title: favBus[i].nombre, subtitle: favBus[i].id, icon: "images/bus.png"});
        }            
    }
    if(favBizi){ //Se ha inicializaco al menos una vez.
        for(i=0;i<favBizi.length;i++){
            console.log("cadena: " + favBizi[i]);
            console.log("nombre: " + favBizi[i].nombre);
            console.log("id: " + favBizi[i].id);
            menuFav.push({title: favBizi[i].nombre, subtitle: favBizi[i].id, icon: "images/bici.png"});
        }            
    }
    // Hasta aqui, ha cargado en menuFav todas las opciones favoritas. Pero, ¿Hay favoritos?
    console.log("Numero de favoritos hasta este momento:" + menuFav.length);
    return menuFav;
};

/* ================================================
======       EMPIEZA EL PROGRAMA EN SI       ======
================================================= */
// ¿En que sentido va a coger el tranvía?

var opcionesEspeciales = [
    {title:"Favoritos", subtitle: "Tus paradas favoritas", icon: "images/Star.png"}
];

var direccionesTranvia = [
    {title:"Hacia Mago de Oz", subtitle:"Linea 1", data: "Mago De Oz", icon:"images/tram.png"},
    {title:"Hacia Avda Academia",subtitle:"Linea 1", data: "Avda Academia", icon:"images/tram.png"}];

var direccionesBuses = [
    {title:"Por línea", data: "LineaBus", icon:"images/bus.png"},
    //{title:"Por cercanía (150m)", subtitle: "Funcion no operativa por el momento", data: "CercaniaBus"}
];

var direccionesBizis = [
    {title:"Por poste", data: "ParadaBizi", icon:"images/bici.png"}
];

var menuInicio = new UI.Menu({
    sections: [{
        title: "Opciones",
        items: opcionesEspeciales,
    },{
        title: 'Lineas de Tranvía',
        items: direccionesTranvia,
    },{
        title: 'Urbanos de Zaragoza',
        items: direccionesBuses,
    },{
        title: 'BiziZaragoza',
        items: direccionesBizis,
    }]
});
// localStorage.removeItem("storedFavBus");
// localStorage.removeItem("storedFavTram");
menuInicio.show();

// Ha seleccionado una opción. ¿Que hacer?

menuInicio.on('select', function(event) {
    
    // SI SELECCIONA LINEA 1 DE TRANVÍA
    if (event.sectionIndex === 1) {
        sentidoLinea = direccionesTranvia[event.itemIndex].data; // en SentidoLinea está la dirección guardada. Ahora, hay que filtrar.
        
        // Muestra una ventana de carga mientras espera a que carguen los datos.
        var ventanaCarga = new UI.Window();
    
        // Texto para avisar al usuario
        var text = new UI.Text({
          position: new Vector2(0, 0),
          size: new Vector2(144, 168),
          text:'Descargando las paradas',
          font:'GOTHIC_18_BOLD',
          color:'black',
          textOverflow:'wrap',
          textAlign:'center',
          backgroundColor:'white'
        });
    
        // Se añade el texto y se muestra.
        ventanaCarga.add(text);
        ventanaCarga.show();
    
        // Obtengamos los datos.
    
        // URL para obtener las lineas
        var URL = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/tranvia.json';
    
        ajax(
          {
            url: URL,
            type:'json'
          },
          function(data) {
            // Crear un array con las lineas de autobús
            var menuItems = lineastram(data);
            // Hay que ordenar las líneas  
            if (sentidoLinea == "Mago De Oz") {
                console.log("Ordenando de manera ascendente (Mago De Oz)");
                menuItems = ordenarParadas(menuItems,"a");
            }
            if (sentidoLinea == "Avda Academia") {
                console.log("Ordenando de manera descendente (Avda Academia)");
                menuItems = ordenarParadas(menuItems,"d");
            }
            
            // Comprobar que se han obtenido de manera correcta
              // Se muestra las opciones de bus
          var menuTram = new UI.Menu({
          sections: [{
            title: 'Paradas del tranvia',
            items: menuItems
          }]
        });
              // Se muestra el menú y se esconde la ventana de carga
        menuTram.show();
        ventanaCarga.hide();
    
        //Mostradas las paradas... ¿Y si ahora pulso? Información de la parada.
              
        menuTram.on('select', function(event) {
            var info = " Proximo tranvia en: \n ";
            console.log("Numero de elementos que hay: " + menuItems[event.itemIndex].data.length);
            if (menuItems[event.itemIndex].data.length > 0) {
                for(var j = 0; j < menuItems[event.itemIndex].data.length; j++) {
                    info = info + menuItems[event.itemIndex].data[j] + "m,  ";                   
                }
            } else {
                info = "No hay tranvias.";
            }
        var detailCard = new UI.Card({
            title: menuItems[event.itemIndex].title,
            subtitle: "Dir. " + sentidoLinea,
            body: info + " \n \n Parada " + menuItems[event.itemIndex].subtitle,
            style: "small",
              });        
            detailCard.show();
            detailCard.on('longClick','select', function(e){
                               // Ha pulsado el botón del centro. FAV. 
                                var ventanaFav = loadVentanaFav();
                                ventanaFav.show();
                                ventanaFav.on('click','up', function(e2){
                                    //Quiere guardar esta parada.
                                    newTramFav(menuItems[event.itemIndex].subtitle,menuItems[event.itemIndex].title,sentidoLinea);
                                    ventanaFav.hide();
                                    ventanaFav.hide();
                                });
                                ventanaFav.on('click','down', function(e2){
                                    //No quiere guardar esta parada.
                                    ventanaFav.hide(); //para ocultar
                                    ventanaFav.hide(); //para eliminar
                                });
                            });
                  
             });
        },
          function(error) {
            console.log('Download failed: ' + error);
          }
        );
    }
    // HASTA AQUI, SI HA SELECCIONADO LINEAS DE TRANVIA.
    // SECCION 2 DEL ARRAY: BUSES
    if (event.sectionIndex === 2) {
        //¿Se ha seleccionado por líneas?
        if (event.itemIndex === 0) {
            
            // Pantalla de carga mientras se descargan las lineas.
            var ventanaCargaBus = new UI.Window();
    
            // Texto para avisar al usuario
            var text2 = new UI.Text({
              position: new Vector2(0, 0),
              size: new Vector2(144, 168),
              text:'Descargando lineas',
              font:'GOTHIC_18_BOLD',
              color:'black',
              textOverflow:'wrap',
              textAlign:'center',
              backgroundColor:'white'
            });
            ventanaCargaBus.add(text2);
            ventanaCargaBus.show();
            // DESDE AQUI
            ajax(
              {
                url: 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/linea.json' ,
                type:'json'
              },
              function(data) {
                // Crear un array con las lineas de autobús. La info esta en data.
                var menuItems = lineasbus(data);
                // Y ordenarlas.
                menuItems = ordenarLineas(menuItems);
                  console.log("Analizando: el titulo de la opcion uno es " + menuItems[0].title + "; o " + menuItems[0].title.toString());
              // Se muestra las opciones de bus
                 var menuBus = new UI.Menu({
                  sections: [{
                    title: 'Lineas de Bus',
                    items: menuItems,
                  }]
                });
              // Se muestra el menú y se esconde la ventana de carga
        menuBus.show();
        ventanaCargaBus.hide();
        //Mostradas las paradas... ¿Y si ahora pulso? Información de la linea.
            menuBus.on('select', function(event2) {
                var linea = menuItems[event2.itemIndex].title;
                console.log("Valor de Linea: " + linea);
                var URL3 = 'http://www.dndzgz.com/fetch?service=bus';
                console.log("La URL del JSON es " + URL3);
                ajax({url:URL3,type:'json'},function(dataLinea){
                    //En dataLinea estan TODAS LAS PARADAS. Sacar las paradas convenientes.
                    console.log("Entra en el Ajax");
                    dataLinea = obtenerParadasBus(dataLinea,linea);
                    
                    // Y hay que ordenarlas. Orden por numero de poste...
                    dataLinea = ordenarParadas(dataLinea,"a");
                    var menuLinea = new UI.Menu({
                      sections: [{
                        title: 'Línea ' + linea,
                        items: dataLinea
                      }]
                    });
                    menuLinea.show();
                    
                    // Linea seleccionada. Ahora, si se pulsa... se selecciona parada!
                    menuLinea.on('select', function(event3) {
                        var poste = dataLinea[event3.itemIndex].subtitle;
                        var URLPoste = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/poste/tuzsa-' + poste + '.json';
                        console.log("URL del Poste: " + URLPoste);
                        ajax({url:URLPoste,type:'json'},function(dataPoste){
                            var posteCard = showInfoBus(dataPoste);
                            posteCard.show();
                            posteCard.on('longClick','select', function(e){
                               // Ha pulsado el botón del centro. FAV. 
                                var ventanaFav = loadVentanaFav();
                                ventanaFav.show();
                                ventanaFav.on('click','up', function(e2){
                                    //Quiere guardar esta parada.
                                    newBusFav(poste,dataLinea[event3.itemIndex].title);
                                    ventanaFav.hide();
                                    ventanaFav.hide();
                                });
                                ventanaFav.on('click','down', function(e2){
                                    //No quiere guardar esta parada.
                                    ventanaFav.hide(); //para ocultar
                                    ventanaFav.hide(); //para eliminar
                                });
                            });
                        });
                    });
                });
             });             
        },
          function(error) {
            console.log('Download failed: ' + error);
          }
        );
            // HASTA AQUI
        }
        //¿Se ha seleccionado por cercanía?
        if (event.itemIndex === 1) {
            
        }
    }
    // HASTA AQUI, SI SE HA SELECCIONADO DEL ARRAY DE BUSES.
    // DESDE AQUI, SE HA SELECCIONADO FAVORITOS?
    if (event.sectionIndex === 0){
        var menuFav = loadMenuFav();
        if(menuFav.length !== 0){
            console.log("Hay algún favorito.");
            var menuCard = new UI.Menu({sections:[{title:"Favoritos",items:menuFav}]});
            menuCard.show();
            menuCard.on('select', function(e2) {
                if(menuFav[e2.itemIndex].icon=="images/bus.png"){
                    //FAVORITO: BUS.
                    console.log("Se ha pulsado en el favorito de un bus. Su ID es: " + menuFav[e2.itemIndex].subtitle );
                    var URL = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/poste/tuzsa-' + menuFav[e2.itemIndex].subtitle + '.json';
                    ajax({url:URL,type:'json'},function(dataPoste){
                        var posteCard = showInfoBus(dataPoste);
                        posteCard.show();
                        posteCard.on('longClick','select', function(e3){
                            var deleteCard = loadDeleteFav();
                            deleteCard.show();
                            deleteCard.on('click','up', function(e4){
                                //Quiere borrar esta parada.
                                console.log("Parada a borrar: " + menuFav[e2.itemIndex].subtitle);
                                deleteBusFav(menuFav[e2.itemIndex].subtitle);
                                deleteCard.hide();
                                posteCard.hide();
                                posteCard.hide();
                                menuFav = loadMenuFav();
                                if(menuFav.length !== 0){menuCard.items(0, menuFav);menuCard.show();}
                                else {
                                    menuCard.hide();menuCard.hide();
                                    var noFavCard = new UI.Card({
                                        title: "No tienes ningun favorito", 
                                        body: "Agrega tu parada a favoritos manteniendo pulsado el botón central cuando estes viendo la información de ese poste o parada", 
                                        scrollable: true, 
                                        style: "small"
                                    });
                                    noFavCard.show();
                                }
                                deleteCard.hide();
                            });
                            deleteCard.on('click','down', function(e4){
                                //No quiere borrar esta parada.
                                deleteCard.hide(); //para ocultar
                                deleteCard.hide(); //para eliminar
                            });
                        });
                    });
                }
                else if(menuFav[e2.itemIndex].icon=="images/tram.png"){
                    //FAVORITO: TRAM.
                    console.log("Se ha pulsado en el favorito de un tranvia. Su ID es: " + menuFav[e2.itemIndex].subtitle );
                    var URL2 = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/tranvia/' + menuFav[e2.itemIndex].subtitle + '.json';
                    ajax({url:URL2,type:'json'},function(dataPoste){
                        var posteCard = showInfoTram(dataPoste,menuFav[e2.itemIndex].direccion);
                        posteCard.show();
                        posteCard.on('longClick','select', function(e3){
                            var deleteCard = loadDeleteFav();
                            deleteCard.show();
                            deleteCard.on('click','up', function(e4){
                                //Quiere borrar esta parada.
                                console.log("Parada a borrar: " + menuFav[e2.itemIndex].subtitle);
                                deleteTramFav(menuFav[e2.itemIndex].subtitle);
                                deleteCard.hide();
                                posteCard.hide();
                                posteCard.hide();
                                menuFav = loadMenuFav();
                                if(menuFav.length !== 0){menuCard.items(0, menuFav);menuCard.show();}
                                else {
                                    menuCard.hide();menuCard.hide();
                                    var noFavCard = new UI.Card({
                                        title: "No tienes ningun favorito", 
                                        body: "Agrega tu parada a favoritos manteniendo pulsado el botón central cuando estes viendo la información de ese poste o parada", 
                                        scrollable: true, 
                                        style: "small"
                                    });
                                    noFavCard.show();
                                }
                                deleteCard.hide();
                            });
                            deleteCard.on('click','down', function(e4){
                                //No quiere borrar esta parada.
                                deleteCard.hide(); //para ocultar
                                deleteCard.hide(); //para eliminar
                            });
                        });
                    });
                    
                }
                else if(menuFav[e2.itemIndex].icon=="images/bici.png"){
                    console.log("Se ha pulsado en el favorito de un tranvia. Su ID es: " + menuFav[e2.itemIndex].subtitle);
                    var URL3 = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/estacion-bicicleta/' + menuFav[e2.itemIndex].subtitle + '.json';
                    ajax({url:URL3,type:'json'},function(dataPoste){
                        var infoBiziCard = showInfoBizi2(dataPoste);
                        infoBiziCard.show();
                        infoBiziCard.on('longClick','select',function(e3){
                            //Quiere borrar la parada...
                            var deleteCard = loadDeleteFav();
                            deleteCard.show();
                            deleteCard.on('click','up', function(e4){
                                console.log("Entra aqui");
                                console.log("Parada a borrar: " + menuFav[e2.itemIndex].subtitle);
                                deleteBiziFav(menuFav[e2.itemIndex].subtitle);
                                deleteCard.hide();
                                infoBiziCard.hide();
                                infoBiziCard.hide();
                                menuFav = loadMenuFav();
                                if(menuFav.length !== 0){menuCard.items(0, menuFav);menuCard.show();}
                                else {
                                    menuCard.hide();menuCard.hide();
                                    var noFavCard = new UI.Card({
                                        title: "No tienes ningun favorito", 
                                        body: "Agrega tu parada a favoritos manteniendo pulsado el botón central cuando estes viendo la información de ese poste o parada", 
                                        scrollable: true, 
                                        style: "small"
                                    });
                                    noFavCard.show();
                                }
                                deleteCard.hide();
                            });
                            deleteCard.on('click','down', function(e4){
                                //No quiere borrar esta parada.
                                deleteCard.hide(); //para ocultar
                                deleteCard.hide(); //para eliminar
                            });
                        });
                    });
                }
            });
        } else {
            // NO HAY NINGUN FAVORITO GUARDADO.
            var noFavCard = new UI.Card({title: "No tienes ningun favorito", body: "Agrega tu parada a favoritos manteniendo pulsado el botón central cuando estes viendo la información de ese poste o parada", scrollable: true, style: "small"});
            noFavCard.show();
        }
    }
    // HASTA AQUI, SI SE HA SELECCIONADO FAVORITOS.
    // DESDE AQUI, SECCION 3 DEL ARRAY: BIZIS.
    if (event.sectionIndex === 3){
        // ¿Se ha seleccionado por poste?
        if (event.itemIndex === 0){
            // Pantalla de carga mientras se descargan las lineas.
            var ventanaCargaBizi = new UI.Window();
    
            // Texto para avisar al usuario
            var text3 = new UI.Text({
              position: new Vector2(0, 0),
              size: new Vector2(144, 168),
              text:'Descargando paradas',
              font:'GOTHIC_18_BOLD',
              color:'black',
              textOverflow:'wrap',
              textAlign:'center',
              backgroundColor:'white'
            });
            ventanaCargaBizi.add(text3);
            ventanaCargaBizi.show();
            ajax(
              {
                url: 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/estacion-bicicleta.json?rf=html&results_only=false&srsname=utm30n&rows=250' ,
                type:'json'
              }, 
                function(data){
                  // Crear un array con las paradas. La info esta en data.
                var menuItems = lineasbizi(data);
                    // Los muestra desordenados! Hay que ordenarlos.
                menuItems = ordenarBizis(menuItems);
                var menuBizi = new UI.Menu({
                  sections: [{
                    title: 'Lineas de Bizi',
                    items: menuItems,
                    }]    
                });
                menuBizi.show();
                ventanaCargaBizi.hide();
                //Muestra la info de manera ordenada (¡Ojo, un menu con 130 opciones!). Ahora, si selecciona una opcion...
                menuBizi.on('select', function(event){
                    //¿Qué opcion se ha indicado?
                    console.log("Se ha pulsado la parada num " + event.itemIndex);
                    console.log("Direccion: " + menuItems[event.itemIndex].subtitle + ";  Estado: " + menuItems[event.itemIndex].estado);
                    var detalleBizi = showInfoBizi(menuItems[event.itemIndex]);
                    detalleBizi.show();
                    // Si mantienes el Select... ¡Favorito!
                    detalleBizi.on('longClick','select', function(e){
                               // Ha pulsado el botón del centro. FAV. 
                                var ventanaFav = loadVentanaFav();
                                ventanaFav.show();
                                ventanaFav.on('click','up', function(e2){
                                    //Quiere guardar esta parada.
                                    newBiziFav(menuItems[event.itemIndex].title, menuItems[event.itemIndex].subtitle);
                                    ventanaFav.hide();
                                    ventanaFav.hide();
                                });
                                ventanaFav.on('click','down', function(e2){
                                    //No quiere guardar esta parada.
                                    ventanaFav.hide(); //para ocultar
                                    ventanaFav.hide(); //para eliminar
                                });
                            });
                });
        });
        }
    }
});