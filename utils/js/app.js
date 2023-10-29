new Vue({
  el: '#app',
  data: () => ({
    id_depart: null,
    id_arrive: null,
    arretes: null,
    sommets: null,
    dataPlusCourChemin: null,
    lignesMetros: null,
    itineraire: null,
    dialog: false,
    couleurLinges: {
      "1": "#FFCE00", "2": "#0064B0", "3": "#9F9825", "3bis": "#98D4E2",
      "4": "#C04191", "5": "#F28E42", "6": "#83C491", "7": "#F3A4BA",
      "7bis": "#83C491", "8": "#CEADD2", "9": "#D5C900", "10": "#E3B32A",
      "11": "#8D5E2A", "12": "#00814F", "13": "#98D4E2", "14": "#662483"
    },
    imageLignes: {
      "1": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-1.1686818034.svg",
      "2": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-2.1686818034.svg",
      "3": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-3.1686818034.svg",
      "3bis": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-3b.1686818034.svg",
      "4": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-4.1686818035.svg",
      "5": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-5.1686818035.svg",
      "6": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-6.1686818035.svg",
      "7": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-7.1686818035.svg",
      "7bis": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-7b.1686818035.svg",
      "8": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-8.1686818035.svg",
      "9": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-9.1686818035.svg",
      "10": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-10.1686818036.svg",
      "11": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-11.1686818036.svg",
      "12": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-12.1686818036.svg",
      "13": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-13.1686818036.svg",
      "14": "https://www.ratp.fr/sites/default/files/lines-assets/picto/metro/picto_metro_ligne-14.1686818036.svg"
    },
    circles: [],
    paths: [],
    id_sommet_acpm: null,
    data_all_acpm: null,
    currentAcpm: null,
    poidsTotalAcpm: null,
    speedDrawingAcpm: 100,
    idTimeout: null,
    listPathAcpm: [],
    listCricleAcpm: [],
  }),
  created() {
    this.readDataGraphe();
  },
  mounted() {
    this.drawCanvas();
  },
  methods: {
    async readDataGraphe() {
      await fetch('./model/graphe.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => {
          this.sommets = data;
        }).catch(error => { console.error("Error:", error); });

      await fetch('./model/arretes.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => {
          this.arretes = data;
        }).catch(error => { console.error("Error:", error); });

      await fetch('./model/ppc_graphe.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(pcc_data => {
          this.dataPlusCourChemin = pcc_data["dict_pcc"];
          this.lignesMetros = pcc_data["lignes"];
        }).catch(error => { console.error("Error :", error); });


      await fetch('./model/acpm.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => {
          this.data_all_acpm = data;
        }).catch(error => { console.error("Error :", error); });

      this.drawAllArretes();
      this.drawAllSommets();

      return true;
    },
    onClickStation(id_sommet, depart = true) {
      if (depart) this.id_depart = id_sommet;
      else this.id_arrive = id_sommet;

      if (this.isDepArr) {
        this.itineraire = this.getItineraireInfo(this.id_depart, this.id_arrive);
        this.drawPath();
      }
    },
    swapItineraire() {
      let sommet = this.id_arrive
      this.id_arrive = this.id_depart;
      this.onClickStation(sommet);
    },
    getItineraireInfo(depart, arrive) {
      var pcc = this.getPlusCourtChemin(depart, arrive);
      const tempsTrajetSecondes = pcc["distance"];
      var cheminSections = this.getCheminPortionDetails(pcc["chemin"]);

      const heureDepart = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const dateArrive = new Date(Date.now() + tempsTrajetSecondes * 1000);
      const heureArrive = dateArrive.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      var itineraireInfo = {
        "portions": cheminSections['portions'],
        "temps_trajet": this.getHeureMinutes(tempsTrajetSecondes),
        "temps_marche": cheminSections['tempsMarcheTotal'],
        "depart": this.getNomSommet(depart),
        "arrive": this.getNomSommet(arrive),
        "heure_depart": heureDepart,
        "heure_arrive": heureArrive
      }
      return itineraireInfo;
    },
    getCheminPortionDetails(chemin) {
      const result = [];
      let marche;
      let tempsMarcheTotal = 0;
      var portion = { "ligne": this.getLigne(chemin[0]), "dep": chemin[0], "arr": null };
      for (let i = 1; i < chemin.length; i++) {
        const brchmtD = parseInt(this.sommets[portion["dep"]].branchement);
        const brchmtA = parseInt(this.sommets[chemin[i]].branchement);
        if (this.estMemeLigne(portion["dep"], chemin[i]) && brchmtD + brchmtA === 3) {
          portion["arr"] = chemin[i - 1];
          result.push(portion)
          portion = { "ligne": this.getLigne(chemin[i]), "dep": chemin[i - 1], "arr": null };
        } else if (!this.estMemeLigne(portion["dep"], chemin[i])) {
          portion["arr"] = chemin[i - 1];
          if (portion["dep"] != portion["arr"]) result.push(portion);

          tempsMarcheTotal += this.getTemps(chemin[i - 1], chemin[i]);
          marche = {
            "marche": true, "dep": chemin[i - 1],
            "arr": chemin[i], "couleur": "black"
          };
          result.push(marche);
          portion = { "ligne": this.getLigne(chemin[i]), "dep": chemin[i], "arr": null };
        }
      }
      if (chemin[chemin.length - 1] != portion["dep"]) {
        portion["arr"] = chemin[chemin.length - 1];
        result.push(portion);
      }
      let sommeTemps = 0;
      let tempsPortion;
      result.forEach(portion_ => {
        pcc = this.getPlusCourtChemin(portion_["dep"], portion_["arr"]);
        tempsPortion = pcc['distance'];
        portion_['temps'] = this.getHeureMinutes(tempsPortion);
        portion_['heureDepart'] = this.getHeureLocale(sommeTemps);
        portion_['heureArrive'] = this.getHeureLocale(sommeTemps + tempsPortion);
        if (!portion_.marche) {
          portion_['direction'] = this.getDirection(portion_["dep"], portion_["arr"]);
          portion_['couleur'] = this.couleurLinges[portion_["ligne"]];
          portion_['img_ligne'] = this.imageLignes[portion_["ligne"]];
          portion_['nb_arret'] = pcc['chemin'].length - 1;
          portion_['arrtets_intermediaires'] = [];

          for (let i = 1; i < pcc['chemin'].length - 1; i++) {
            portion_['arrtets_intermediaires'].push(this.getNomSommet(pcc['chemin'][i]));
          }
        }

        sommeTemps += tempsPortion;

        portion_['points'] = [];
        var point;
        for (let i = 0; i < pcc['chemin'].length; i++) {
          point = {
            "nom": this.getNomSommet(pcc['chemin'][i]),
            "position": this.getPosition(pcc['chemin'][i])
          };
          portion_['points'].push(point);
        }
        portion_['id'] = "portion" + portion_["dep"] + portion_["arr"]
        portion_['depart'] = this.getNomSommet(portion_["dep"]);
        portion_['arrive'] = this.getNomSommet(portion_["arr"]);
      });
      result[result.length - 1]['is_arrive'] = true;
      return { 'portions': result, 'tempsMarcheTotal': this.getHeureMinutes(tempsMarcheTotal) };
    },
    estMemeLigne(s1, s2) {
      return this.sommets[s1]['num_ligne'] === this.sommets[s2]['num_ligne'];
    },
    getLigne(sommet) { return this.sommets[sommet]['num_ligne'] },
    getNomSommet(sommet) { return this.sommets[sommet]['nom'] },
    getPosition(sommet) { return this.sommets[sommet]['position'] },
    getTemps(s1, s2) { return this.sommets[s1]['voisins'][s2] },
    getHeureMinutes(t) {
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      // if (h === 0 && m === 0) return '1';
      return h === 0 ? m : h + "h" + m;
    },
    getHeureLocale(t) {
      const heure = new Date(Date.now() + t * 1000);
      // const heureArrive = dateArrive.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return heure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    },
    getPlusCourtChemin(depart, arrive) {
      if (this.sommets && this.dataPlusCourChemin && this.lignesMetros && depart != arrive) {
        var pcc;
        if (depart > arrive) {
          pcc = JSON.parse(JSON.stringify(this.dataPlusCourChemin[depart][arrive]));
          // pcc = this.dataPlusCourChemin[depart][arrive];
        }
        else {
          pcc = JSON.parse(JSON.stringify(this.dataPlusCourChemin[arrive][depart]));
          // pcc = this.dataPlusCourChemin[arrive][depart];
          pcc['chemin'].reverse();
        }

        return pcc;
      }
      return false;
    },
    getDirection(depart, arrive) {
      const brchmtD = parseInt(this.sommets[depart].branchement);
      const brchmtA = parseInt(this.sommets[arrive].branchement);
      if (this.sommets[depart].numLigne !== this.sommets[arrive].numLigne || brchmtD + brchmtA === 3)
        return false;
      const numLigne = this.sommets[depart].num_ligne;
      let chemin;
      if (brchmtD === 1 || brchmtA === 1) {
        chemin = this.lignesMetros[numLigne]["1"];
      } else if (brchmtD === 2 || brchmtA === 2) {
        chemin = this.lignesMetros[numLigne]["2"];
      } else if (!Array.isArray(this.lignesMetros[numLigne]) && brchmtD === 0 && brchmtA === 0) {
        chemin = this.lignesMetros[numLigne][Math.random() < 0.5 ? "1" : "2"];
      } else chemin = this.lignesMetros[numLigne];
      for (const s of chemin) {
        if (s === depart) return this.sommets[chemin[chemin.length - 1]].nom;
        if (s === arrive) return this.sommets[chemin[0]].nom;
      }
      return false;
    },
    drawAllSommets() {
      for (var i = 0; i < this.sommets.length; i++) {
        const pt = this.sommets[i]['position'];
        var point = new paper.Point(pt[0], pt[1]);
        var circle = new paper.Path.Circle({
          center: point,
          radius: 3,
          fillColor: 'grey'
        });
      }
    },
    drawAllArretes() {
      this.arretes.forEach(arret => {
        const pointA = this.sommets[arret[0]].position;
        const pointB = this.sommets[arret[1]].position;
        const path = new paper.Path();
        path.strokeColor = "grey";
        path.strokeWidth = 2;

        const point_a = new paper.Point(pointA[0], pointA[1]);
        path.add(point_a);
        const point_b = new paper.Point(pointB[0], pointB[1]);
        path.add(point_b);
      });
    },
    async drawPath() {
      this.removeDrawing();
      clearTimeout(this.idTimeout);
      this.drawPointName(this.id_depart);
      this.drawPointName(this.id_arrive);

      for (p in this.itineraire.portions) {
        const portion = this.itineraire.portions[p];
        this.drawPortion(portion.points, portion.couleur);
      }
      
    },
    drawPortion(points, couleur) {
      const path = new paper.Path();
      path.strokeColor = couleur;
      path.strokeWidth = 4;
      this.drawPointSegment(this, 0, points, path, couleur);
      this.paths.push(path);
    },
    drawPointSegment(this_, index, points, path, couleur) {
      if (index < points.length) {
        const point = new paper.Point(points[index]['position'][0], points[index]['position'][1]);
        path.add(point);
        const circle = new paper.Path.Circle(point, 5);
        circle.fillColor = couleur;
        this.circles.push(circle);
        this_.idTimeout = setTimeout(function () {
          this_.drawPointSegment(this_, index + 1, points, path);
        }, this_.speedDrawingAcpm);
      }
    },
    drawSegment(object, index, randomColor) {
      if (index < this.currentAcpm.length) {
        const arret = this.currentAcpm[index];
        const pointA = this.sommets[arret[0]].position;
        const pointB = this.sommets[arret[1]].position;
        const path = new paper.Path();
        path.strokeColor = randomColor;
        path.strokeWidth = 3;
        const point_a = new paper.Point(pointA[0], pointA[1]);
        path.add(point_a);
        const circle_a = new paper.Path.Circle(point_a, 5);
        circle_a.fillColor = randomColor;
        const point_b = new paper.Point(pointB[0], pointB[1]);
        path.add(point_b);
        const circle_b = new paper.Path.Circle(point_b, 5);
        circle_b.fillColor = randomColor;
        this.listPathAcpm.push(path);
        this.listCricleAcpm.push(circle_a);
        this.listCricleAcpm.push(circle_b);

        object.idTimeout = setTimeout(function () {
          object.drawSegment(object, index + 1, randomColor);
        }, object.speedDrawingAcpm);
      }

    },
    onSelectSommetAcpm(id_sommet_acpm) {
      this.id_sommet_acpm = id_sommet_acpm;

      // Recuper les positions de chaque arrete de l'acpm

      this.removeDrawing();
      this.currentAcpm = this.data_all_acpm[this.id_sommet_acpm]['arbre'];
      this.poidsTotalAcpm = this.data_all_acpm[this.id_sommet_acpm]['poids_total'];

      const randomColor = "#" + ((1 << 24) * Math.random() | 0).toString(16).padStart(6, "0");
      this.drawPointName(id_sommet_acpm);
      clearTimeout(this.idTimeout);
      this.drawSegment(this, 0, randomColor);
      // acpm.forEach( (arret, index) => {
      //   // const pointA = this.sommets[arret[0]].position;
      //   // const pointB = this.sommets[arret[1]].position;
      //   // const path = new paper.Path();
      //   // path.strokeColor = randomColor;
      //   // path.strokeWidth = 3;
      //   // const point_a = new paper.Point(pointA[0], pointA[1]);
      //   // path.add(point_a);
      //   // const circle_a = new paper.Path.Circle(point_a, 5);
      //   // circle_a.fillColor = randomColor;
      //   // const point_b = new paper.Point(pointB[0], pointB[1]);
      //   // path.add(point_b);
      //   // const circle_b = new paper.Path.Circle(point_b, 5);
      //   // circle_b.fillColor = randomColor;
      //   // this.listPathAcpm.push(path);
      //   // this.listCricleAcpm.push(circle_a);
      //   // this.listCricleAcpm.push(circle_b);
      // setTimeout(function () {
      //   this.drawSegment(index, randomColor);
      // }, 1000);

      // });




    },
    removeDrawing() {
      for (const p in this.paths) {
        this.paths[p].remove();
      }
      for (const c in this.circles) {
        this.circles[c].remove();
      }
      this.circles = [];
      this.paths = [];
      this.listPathAcpm.forEach(path => {
        path.remove();
      });
      this.listPathAcpm = [];

      this.listCricleAcpm.forEach(circle => {
        circle.remove();
      });
      this.listCricleAcpm = [];
    },
    drawCanvas() {
      var canvas = document.getElementById("myCanvas"),
        ctx = canvas.getContext("2d");

      canvas.width = 903;
      canvas.height = 657;


      var background = new Image();
      background.src = "https://www.ratp.fr/plan-de-ligne/img/metro/Plan-Metro.1669996027.png";

      // Make sure the image is loaded first otherwise nothing will draw.
      background.onload = function () {
        ctx.drawImage(background, 0, 0);
      }
    },
    drawPointName(sommet) {
      const pos_point = this.sommets[sommet].position;
      const point = new paper.Point(pos_point[0], pos_point[1]);
      const circle = new paper.Path.Circle(point, 10);
      circle.fillColor = "black";
      var label = new paper.PointText({
        point: new paper.Point(pos_point[0] + 20, pos_point[1]),
        content: this.sommets[sommet].nom,
        fillColor: 'black',
        fontSize: 20
      });

      this.listCricleAcpm.push(circle);
      this.listCricleAcpm.push(label);
    },
  },
  computed: {
    isDepArr() {
      return this.id_depart != null && this.id_arrive != null && this.id_depart != this.id_arrive;
    }
  },
  vuetify: new Vuetify(),
});