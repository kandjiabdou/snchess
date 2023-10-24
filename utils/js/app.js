new Vue({
  el: '#app',
  data: () => ({
    id_depart: null,
    id_arrive: null,
    graphe: null,
    sommets: null,
    dataPlusCourChemin: null,
    lignesMetros: null,
    itineraire: null,
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
    }
  }),
  created() {
    this.readDataGraphe();
    console.log("created data")
    paper.setup('myCanvas');
  },
  mounted() {
    console.log("montéé");
  },
  methods: {
    async readDataGraphe() {
      await fetch('./model/sommets.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(data => { this.sommets = data; })
        .catch(error => { console.error("Error:", error); });
      await fetch('./model/ppc_graphe.json', { mode: 'no-cors' })
        .then(response => response.json())
        .then(pcc_data => {
          this.dataPlusCourChemin = pcc_data["dict_pcc"];
          this.lignesMetros = pcc_data["lignes"];
          this.drawAllSommets();
        }).catch(error => { console.error("Error :", error); });
      
      return true;
    },
    onClickStation(id_sommet, depart = true) {
      if (depart) this.id_depart = id_sommet;
      else this.id_arrive = id_sommet;
      if (this.id_depart != null && this.id_arrive != null && this.id_depart != this.id_arrive) {
        console.log("________________________________________");
        this.itineraire = this.getItineraireInfo(this.id_depart, this.id_arrive);
        this.drawPath();
        // console.log(this.itineraire);
      }
    },
    getItineraireInfo(depart, arrive) {
      const pcc = this.getPlusCourtChemin(depart, arrive);
      const cheminSections = this.getCheminPortionDetails(pcc["chemin"]);
      const itineraireInfo = {
        "portions": cheminSections['portions'],
        "temps_trajet": this.getHeureMinutes(pcc["distance"]),
        "temps_marche": cheminSections['tempsMarcheTotal'],
        "depart": this.getNomSommet(depart),
        "arrive": this.getNomSommet(arrive),
        "heure_depart": "15h54",
        "heure_arrive": "16h35"
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
          const temps_marche = this.getHeureMinutes(this.getTemps(chemin[i - 1], chemin[i]));
          tempsMarcheTotal += this.getTemps(chemin[i - 1], chemin[i]);
          marche = {
            "marche": true, "dep": chemin[i - 1],
            "arr": chemin[i], "temps": temps_marche
          };
          result.push(marche);
          portion = { "ligne": this.getLigne(chemin[i]), "dep": chemin[i], "arr": null };
        }
      }
      if (chemin[chemin.length - 1] != portion["dep"]) {
        portion["arr"] = chemin[chemin.length - 1];
        result.push(portion);
      }
      result.forEach(portion_ => {
        pcc = this.getPlusCourtChemin(portion_["dep"], portion_["arr"]);
        if (pcc) {
          portion_['temps'] = this.getHeureMinutes(pcc['distance']);
          portion_['direction'] = this.getDirection(portion_["dep"], portion_["arr"]);
          portion_['couleur'] = this.couleurLinges[portion_["ligne"]];
          portion_['img_ligne'] = this.imageLignes[portion_["ligne"]];
          portion_['nb_arret'] = pcc['chemin'].length - 1;
          portion_['arrtets_intermediaires'] = [];
          for (let i = 1; i < pcc['chemin'].length - 1; i++) {
            portion_['arrtets_intermediaires'].push(this.getNomSommet(pcc['chemin'][i]));
          }
          portion_['points'] = [];
          var point;
          for (let i = 0; i < pcc['chemin'].length; i++) {
            point = {
              "nom": this.getNomSommet(pcc['chemin'][i]),
              "position": this.getPosition(pcc['chemin'][i])
            };
            portion_['points'].push(point);
          }
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
      if (h === 0 && m === 0) return '1';
      return h === 0 ? m : h + "h" + m;
    },
    getPlusCourtChemin(depart, arrive) {
      if (this.sommets && this.dataPlusCourChemin && this.lignesMetros && depart != arrive) {
        var pcc;
        if (depart > arrive) pcc = this.dataPlusCourChemin[depart][arrive];
        else {
          pcc = this.dataPlusCourChemin[arrive][depart];
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
      console.log(this.sommets);
      for (var i = 0; i < this.sommets.length; i++) {
        const pt = this.sommets[i]['position'];
        var point = new paper.Point( pt[0], pt[1]);
        var circle = new paper.Path.Circle({
          center: point,
          radius: 5,
          fillColor: 'black'
        });
      }
    },
    drawPath() {
      console.log(this.itineraire);
    }
  },
  computed:{
  },
  vuetify: new Vuetify(),
});