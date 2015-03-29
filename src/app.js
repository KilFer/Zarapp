// Version 0.8

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
    }}
    
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
                newArray.push({title:array[i].title.toString()});
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
                newArray.push({title:actualPeque.toString()});
            }
        }while(actualPeque!=999);
        // Ordenados los numericos. Ahora, las lanzaderas...
        for(i=0; i<array.length; i++){
            if(array[i].title.indexOf("C")!=-1 && array[i].title.length == 2){
                // Detectado una Lanzadera. Pasarla al array.
                newArray.push({title:array[i].title.toString()});
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

// Funcion que coge la información util del Array de linea de bus
 var ordenarParadasBus = function(array){
    var returnArray = [];
    console.log("Llega a Ordenar paradas.");
    for(var i = 0; i < array.totalCount; i++){
        if(array.result[i].link){
            console.log("Ha encontrado un link");
            //Si existe link, es que existe esa parada.
            var link = array.result[i].link;
            console.log("Posicion del = en " + link.indexOf('=') + ", posicion del & en " + link.indexOf('&'));
            var poste = link.substring(link.indexOf('=')+1,link.indexOf('&'));
            var parada = link.substring(link.lastIndexOf("=")+1,link.length);
            console.log("Parada: " + parada + ", poste: " + poste);
            returnArray.push({title:parada,subtitle:poste,geometry:array.result[i].geometry});
        }
    }
    return returnArray;
 };


/* ================================================
======       EMPIEZA EL PROGRAMA EN SI       ======
================================================= */
// ¿En que sentido va a coger el tranvía?

var direccionesTranvia = [
    {title:"Hacia Mago de Oz", subtitle:"Linea 1", data: "Mago De Oz"},
    {title:"Hacia Avda Academia",subtitle:"Linea 1", data: "Avda Academia"}];

var direccionesBuses = [
    {title:"Por línea", data: "LineaBus"},
    //{title:"Por cercanía (150m)", subtitle: "Funcion no operativa por el momento", data: "CercaniaBus"}
];

var menuInicio = new UI.Menu({
  sections: [{
    title: 'Lineas de Tranvía',
    items: direccionesTranvia,
  },{
      title: 'Urbanos de Zaragoza',
      items: direccionesBuses,
  }]
});
menuInicio.show();

// Ha seleccionado una opción. ¿Que hacer?

menuInicio.on('select', function(event) {
    
    // SI SELECCIONA LINEA 1 DE TRANVÍA
    if (event.sectionIndex === 0) {
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
            
                  
             });
        },
          function(error) {
            console.log('Download failed: ' + error);
          }
        );
    }
    // HASTA AQUI, SI HA SELECCIONADO LINEAS DE TRANVIA.
    // SECCION 2 DEL ARRAY: BUSES
    if (event.sectionIndex === 1) {
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
                var URL3 = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/transporte-urbano/linea/' + linea + '.json';
                console.log("La URL del JSON es " + URL3);
                ajax({url:URL3,type:'json'},function(dataLinea){
                    //En dataLinea hay mucha información inútil. Sacar la información útil.
                    console.log("Entra en el Ajax");
                    dataLinea = ordenarParadasBus(dataLinea);
                    var menuLinea = new UI.Menu({
                      sections: [{
                        title: 'Paradas de bus',
                        items: dataLinea
                      }]
                    });
                    menuLinea.show();
                    //SEGUIR!
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
});