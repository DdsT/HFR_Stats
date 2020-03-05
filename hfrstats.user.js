// ==UserScript==
// @name           [HFR] Stats
// @namespace      ddst.github.io
// @version        0.0.2
// @description    Afficher les statistiques d'un membre
// @author         DdsT
// @URL            https://ddst.github.io/HFR_Stats/
// @downloadURL    https://ddst.github.io/HFR_Stats/hfrstats.user.js
// @updateURL      https://ddst.github.io/HFR_Stats/hfrstats.meta.js
// @icon           https://forum.hardware.fr/favicon.ico
// @match          *://forum.hardware.fr/forum2.php*
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// ==/UserScript==

/*
Copyright (C) 2020 DdsT

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see https://ddst.github.io/HFR_Stats/LICENSE.
*/

/************** TODO *****************
 * beaucoup
 *************************************/

this.$ = this.jQuery = jQuery.noConflict(true);

const VERSION = GM.info.script.version;
const ROOT    = document.getElementById("mesdiscussions");
const POST    = $("input[name='post']").attr("value");
const CAT     = $("input[name='cat']").attr("value");
const TOPIC   = CAT & POST;
const TITLE   = $(".fondForum2Title").find("h3").text();

/********************
 * MODULE INTERFACE * 
 ********************/

const CHART_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGvSURBVDjLpZO7alZREEbXiSdqJJDKYJNCkPBXYq12prHwBezSCpaidnY+graCYO0DpLRTQcR3EFLl8p+9525xgkRIJJApB2bN+gZmqCouU+NZzVef9isyUYeIRD0RTz482xouBBBNHi5u4JlkgUfx+evhxQ2aJRrJ/oFjUWysXeG45cUBy+aoJ90Sj0LGFY6anw2o1y/mK2ZS5pQ50+2XiBbdCvPk+mpw2OM/Bo92IJMhgiGCox+JeNEksIC11eLwvAhlzuAO37+BG9y9x3FTuiWTzhH61QFvdg5AdAZIB3Mw50AKsaRJYlGsX0tymTzf2y1TR9WwbogYY3ZhxR26gBmocrxMuhZNE435FtmSx1tP8QgiHEvj45d3jNlONouAKrjjzWaDv4CkmmNu/Pz9CzVh++Yd2rIz5tTnwdZmAzNymXT9F5AtMFeaTogJYkJfdsaaGpyO4E62pJ0yUCtKQFxo0hAT1JU2CWNOJ5vvP4AIcKeao17c2ljFE8SKEkVdWWxu42GYK9KE4c3O20pzSpyyoCx4v/6ECkCTCqccKorNxR5uSXgQnmQkw2Xf+Q+0iqQ9Ap64TwAAAABJRU5ErkJggg==";
/* Icons by Mark James - http://www.famfamfam.com/lab/icons/silk/ - CC BY 2.5 - https://creativecommons.org/licenses/by/2.5/ */

const STYLE = `
  #hfr-stats-container {
    font-size   : 10px;
    position    : fixed;
    left        : 0;
    right       : 0;
    top         : 0;
    bottom      : 0;
    display     : none;
    z-index     : 9999;
  }

  #hfr-stats-modal {
    margin         : auto auto;
    background     : white;
    padding        : 10px;
    box-shadow     : 0 4px  8px 0 rgba(0, 0, 0, 0.2),
                     0 6px 20px 0 rgba(0, 0, 0, 0.19);
    transition     : opacity 0.7s ease 0s;
    pointer-events : auto;
  }

  #hfr-stats-tooltip {
    padding       : 10px;
    background    : rgba(0,0,0,0.8);
    color         : #bbb;
    font-size     : 12px;
    position      : absolute;
    z-index       : 99999;
    text-align    : center;
    border-radius : 3px;
    display       : none;
  }

  #hfr-stats-tooltip:after {
    -moz-box-sizing  : border-box;
    box-sizing       : border-box;
    position         : absolute;
    left             : 50%;
    height           : 5px;
    width            : 5px;
    bottom           : -10px;
    margin           : 0 0 0 -5px;
    content          : " ";
    border           : 5px solid transparent;
    border-top-color : rgba(0,0,0,0.8);
  }

  #hfr-stats-progress {
    width            : 400px;
    background-color : #eee;
    margin           : 0 auto;
    display          : none;
  }
  
  #hfr-stats-bar {
    width            : 0%;
    height           : 30px;
    background-color : #8cc665;
  }

  #hfr-stats-results {
    display : none;
  }
`;

/* Remplace GM.addstyle pour des soucis de compatibilité */
function addStyle(aCss) {
  let head = document.getElementsByTagName('head')[0];
  if (head) {
    let style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = aCss;
    $(head).append($(style));
  }
}

let statsContainer = document.createElement("div");
statsContainer.id = "hfr-stats-container";
statsContainer.show = () => {
  statsContainer.style.display = "flex";
};
statsContainer.hide = () => {
  statsContainer.style.display = "none";
  results.hide();
};
$(ROOT).append(statsContainer);

/* Cache la fenêtre lors d'un clic extérieur */
document.addEventListener("click", (event) => {
  const targetClass = event.target.classList[0];
  if (targetClass != "hfr-stats" && !event.target.closest("#hfr-stats-modal"))
    statsContainer.hide();
});

let statsModal = document.createElement("div");
statsModal.id = "hfr-stats-modal";
$(statsContainer).append($(statsModal));

let progress = document.createElement("div");
progress.id = "hfr-stats-progress";
progress.show = () => {
  progress.style.display = "block";
  statsContainer.show();
};
progress.hide = () => {
  progress.style.display = "none";
  bar.setProgress(0);
};
let bar = document.createElement("div");
bar.id = "hfr-stats-bar";
bar.setProgress = (progress) => {bar.style.width = progress + "%";};
$(statsModal).append($(progress));
$(progress).append($(bar));

let results = document.createElement("div");
results.id = "hfr-stats-results";
results.show = () => {
  results.style.display = "block";
  statsContainer.show();
  summary.update();
};
results.hide = () => {
  results.style.display = "none";
};
$(statsModal).append($(results));

let summary = document.createElement("div");
summary.id = "hfr-stats-summary";
summary.update = () => {
  let html = "";
  let begin = new Date(formattedData.begin);
  let end = new Date(formattedData.end);
  let messageDay = formattedData.total / (end- begin) * 1000*60*60*24;
  let subMessageDay = formattedData.subtotal / (query.end - query.begin) * 1000*60*60*24;
  html += `<h2>Statistiques de ${query.pseudo}</h2><h3>${TITLE}</h3><p>`;
  html += `<b>${formattedData.total}</b> Messages postés entre le ${getDisplayDate(begin)} et le ${getDisplayDate(end)}, soit <b>${messageDay.toFixed(2)}</b> messages/jour.<br>`;
  html += `<b>${formattedData.subtotal}</b> Messages postés entre le ${getDisplayDate(query.begin)} et le ${getDisplayDate(query.end)}, soit <b>${subMessageDay.toFixed(2)}</b> messages/jour.</p>`;
  $(summary).html(html);
};
$(results).append($(summary));

/* Ajouter le bouton de statistiques à la barre d'outil d'un message */
function decorate(message) {
  let toolbar = $(message).find(".toolbar div").get(0);
  let button = document.createElement("img");
  let pseudo = $(message).find("b.s2").text();
  button.src = CHART_ICON;
  button.className = "hfr-stats";
  button.title = `Statistiques de ${pseudo} pour ce sujet`;
  button.style.cursor = "pointer";
  button.pseudo = pseudo;
  button.onclick = buttonClick;
  $(toolbar).append($(button));
}

function buttonClick() {
  launchQuery(this.pseudo);
  progress.show();
}

function launchQuery(pseudo) {
  let end   = new Date();
  let begin = new Date();
  begin.setMonth(begin.getMonth() - 12);
  update(pseudo, begin, end);
}

/********************
 * MODULE GRAPHIQUE *
 ********************/

/* Afficher les résultats */
function showResult() {
  let yearChart = newChart({data: formattedData, begin: query.begin, end: query.end});
  if (results.yearChart) results.yearChart.remove();
  results.yearChart = yearChart;
  yearChart.id = "hfr-stats-chart";
  results.appendChild(yearChart);
  results.show();
  progress.hide();
}

/* Infobulle du graphique */
let tooltip = document.createElement("div");
tooltip.id = "hfr-stats-tooltip";
ROOT.appendChild(tooltip);
function mouseLeave(evt) {
  tooltip.style.display ="none";
}
function mouseEnter(evt) {
  let targetOffset = $(evt.target).offset();
  let count = $(evt.target).attr('data-count');
  let date = $(evt.target).attr('data-date');
  let countText = ( count > 1 ) ? "messages" : "message";
  tooltip.style.display ="block";
  $(tooltip).html(`${count} ${countText} le ${date}`);

  let svgWidth = Math.round($(tooltip).width() / 2 + 5 )  ;
  let svgHeight = $(tooltip).height() * 2 + 10 ;

  $(tooltip).css({top:targetOffset.top - svgHeight - 5});
  $(tooltip).css({left:targetOffset.left - svgWidth});
}

/* Créer un graphique d'activité
 * Code adapté du projet Github-Contribution-Graph par bachvtuan
 * https://github.com/bachvtuan/Github-Contribution-Graph 
 */
function newChart(options) {
  
  let div = document.createElement("div");

  let settings = $.extend({
    colors:    ['#eeeeee','#d6e685','#8cc665','#44a340','#44a340'],
    threshold: [0        ,1        ,5        ,10       ,20       ],
    monthNames: ['Jan','Fev','Mar','Avr','Mai','Jui','Jui','Aoû','Sep','Oct','Nov','Dec'],
    dayNames : ["Lu","Ma","Me","Je","Ve","Sa","Di"],
    data:{}
  }, options );

  let dateList = settings.data.dateList;

  let getCount = function(displayDate) {
    return (dateList[displayDate]) ? dateList[displayDate] : 0;
  }

  let getColor = function(count) {
    let i = 0;
    while (i < settings.threshold.length && count >= settings.threshold[i]) ++i;
    return settings.colors[i-1];
  }

  if (!settings.end) settings.end = new Date();
  let end = new Date(settings.end);
  if (!settings.begin) {
    settings.begin = new Date();
    settings.begin.setMonth(settings.begin.getMonth() - 12);
  } 
  let date = new Date(settings.begin);
  let dayOffset = date.getDay();
  if (dayOffset != 1) {
    //Si le premier jour de la plage considérée n'est pas un lundi, commencer au lundi précédent
    date.setDate( date.getDate() + 1 - dayOffset);
  }
  let currentMonth = date.getMonth();
  let html = "";
  let size = 13;
  let monthIndex = [{index: date.getMonth(), x: 0 }];
  let xOffset = 0;

  for (let week = 0; date <= end; ++week) {
    //chaque semaine est parcourue jusqu'à arriver à la fin de la plage considérée
    html += `<g transform="translate(${xOffset.toString()},0)">`;
    
    let yOffset = 0;
    for (let day = 0; (day < 7 && date <= end); ++day) {

      let month = date.getMonth();
      let displayDate = getDisplayDate(date);

      if ( day == 0 && month != currentMonth ){
        //En cas de nouveau mois, noter son emplacement
        currentMonth = month;
        monthIndex.push({index: currentMonth, x: xOffset });
      }
      
      let count = getCount(displayDate);
      let color = getColor(count);
      if (dayOffset > 1) {
        //Les premiers jours du graphique sont ignorés s'ils ne sont pas dans la plage temporelle considérée
        html += `<rect width="${size - 2}" height="${size - 2}" y="${yOffset}" fill="white"/>`;
        --dayOffset;
      } else {
        html += `<rect class="hfr-stats-day" width="${size - 2}" height="${size - 2}" y="${yOffset}" fill="${color}" data-count="${count}" data-date="${displayDate}"/>`;
      }
      
      //la date est incrémentée d'un jour
      date.setDate( date.getDate() + 1 );
      yOffset += size;
    }
    xOffset += size;
    html += "</g>";
  }

  if (monthIndex[1].x - monthIndex[0].x < 40) {
    //Retirer le label du premier mois en cas de chevauchement
    monthIndex.shift(0);  
  }
  
  //Ajout des mois
  for (const month of monthIndex){
    html += `<text x="${month.x}" y="-5" class="month">${settings.monthNames[month.index]}</text>'`;
  }

  //Ajout des jours de la semaine
  for (const [i,text] of settings.dayNames.entries()) {
    html += `<text text-anchor="middle" class="wday" dx="-10" dy="${size * (i + 1) - 4}">${text}</text>`;
  }

  html = `<svg width="721" height="110"><g transform="translate(20, 20)">${html}</g></svg>`;

  $(div).html(html); 
  $(div).find('.hfr-stats-day').on("mouseenter", mouseEnter);
  $(div).find('.hfr-stats-day').on("mouseleave", mouseLeave);
  
  return div;
};

/****************** 
 * MODULE DONNÉES *
 ******************/

/* Liste contenant l'ensemble des messages du membre */
let messageList = [];

/* Liste des messages utilisés pour les visualisations */
let formattedData = {};

/* Décomposer un message en un objet facilement manipulable */
function parse(message) {
  let parsedMessage = {
    id           : null, // ID du message
    date         : null, // date de création du message
    editDate     : null, // dernière date d'édition du message
    quoteNumber  : null, // nombre de fois que le message a été cité
    quotedMember : [],   // liste des membres cités par le message
    smileys      : [],   // liste des smileys présents dans le message
    body         : null  // corps du message dépouillé des éléments non textuels
  };
  
  const dateMatched = $(message).find(".toolbar").text().match(/(\d\d)-(\d\d)-(\d\d\d\d).*(\d\d:\d\d:\d\d)/);
  if (dateMatched.length >= 5) {
    parsedMessage.date = Date.parse(`${dateMatched[3]}-${dateMatched[2]}-${dateMatched[1]} ${dateMatched[4]}`);
  } 
  
  return parsedMessage;
}

/* Mettre en forme les données dans la plage temporelle considérée pour la visualisation */
function formatData() {
  formattedData = {
    dateList : {},
    total    : messageList.length,
    subtotal : 0,
    begin    : messageList[0].date,
    end      : messageList[messageList.length-1].date
  };
  for (const timestamp of messageList) {
    let timestampDate = new Date(timestamp.date);
    if (timestampDate >= query.begin && timestampDate <= query.end) {
      ++formattedData.subtotal;
      let displayDate = getDisplayDate(timestampDate);
      if (!formattedData.dateList[displayDate]) {
        formattedData.dateList[displayDate] = 1;
      } else {
        ++formattedData.dateList[displayDate];
      }  
    }
  }
}

/********************
 * MODULE RECHERCHE *
 ********************/

/* Requête utilisée pour récupérer les messages d'un membre */
let query = {
  pseudo     : "",
  currentnum : 0,
  get url() {
    return `https://forum.hardware.fr/forum2.php?post=${POST}&cat=${CAT}&spseudo=${fixPseudo(query.pseudo)}&currentnum=${query.currentnum}&filter=1`;
  }
}

/* Mettre à jour les statistiques d'un membre */
function update(pseudo, begin, end) {
  query.pseudo     = pseudo;
  query.currentnum = 0;
  query.begin      = begin;
  query.end        = end;
  messageList      = [];
  search();
}

/* Effectuer une recherche filtrée sur un pseudo */
function search() {
  $.get(query.url, {}, parseSearch);
}

/* Traiter la page obtenue lors d'une recherche filtrée sur un pseudo */
function parseSearch(data) {
  let searchPage = $.parseHTML(data);
  let searchTable = $(searchPage).find(".messagetable");
  for (let i = 0; i < searchTable.length; ++i) {
    let parsedMessage = parse(searchTable.get(i));
    messageList.push(parsedMessage);
  }
  let currentnum = $(searchPage).find("input[name='currentnum']").get(0)
  let today = Date.parse(new Date());
  let progress = (messageList[messageList.length-1].date - messageList[0].date) / (today - messageList[0].date) * 100;
  bar.setProgress(progress);
  if (currentnum) {
    //Une page contient au maximum 200 messages du membre, le numéro du dernier message est utilisé pour voir les messages suivants
    query.currentnum = currentnum.value;
    search();
  } else {
    formatData();
    showResult();
  }
}

/*********************
 * MODULE TRANSVERSE *
 *********************/

function fixPseudo(str) {
  return encodeURIComponent(str.replace(/\u200b/g, "").toLowerCase()).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

function getDisplayDate(date) {
  return date.toLocaleString("fr-fr").replace(/ à .*/,"");
}

/***************************
 * INTIALISATION DU SCRIPT *
 ***************************/

addStyle(STYLE);
// Ajout des icones aux barres d'outil
$(".messagetable").each(function() {
  decorate(this);
});
