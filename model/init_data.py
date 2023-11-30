import os, json, time, random
from unidecode import unidecode

def prim(graph, sommetDepart):
    ACPM = []
    visited = set()
    visited.add(sommetDepart)
    poids_total = 0
    while len(visited) < len(graph):
        poids_minimum = float('inf')
        min_E = None
        for sommet in visited:
            list_voisins = graph[int(sommet)]['voisins']
            for voisin in list_voisins:
                if int(voisin) not in visited and int(list_voisins[voisin]) < poids_minimum:
                    poids_minimum = int(list_voisins[voisin])
                    min_E = [int(sommet), int(voisin)]
        if min_E:
            u, v = min_E
            ACPM.append((u, v, poids_minimum))
            visited.add(v)
            poids_total += poids_minimum
    return ACPM, poids_total


def prim_all_sommet(graphe):
    file_acpms = "acpm.json"
    if os.path.exists(file_acpms):
        with open(file_acpms, 'r', encoding = "utf8") as data_acpm_file:
            return json.load(data_acpm_file)
    data_all_acpm = {}

    for v in range(len(graphe)):
        acpm, poids_total = prim(graphe, v)
        data_all_acpm[v] = {"poids_total": poids_total, "arbre": acpm}

    with open(file_acpms, 'w', encoding="utf8") as file_save_acpms:
        json.dump(data_all_acpm, file_save_acpms)
    return data_all_acpm



def get_sommet_position(file_name):
    positions = {}
    with open(file_name, "r", encoding = "utf8") as file:
        for ligne in file:
            ligne = unidecode(ligne).lower()
            station = ligne.strip().split(";")
            x, y, nom = station
            if not nom in positions :
                positions[nom] = [[int(x), int(y)]]
            else : positions[nom].append([int(x), int(y)])
    return positions

def get_graphe(file_name, pospoints):
    """
    Cette fonction charge le données du graphe à partir d'un fichier de donné.
    
    Complexité O(|V|+|E|)

    Args:
        file_name (str): Le nom du fichier contenant les données du graphe (sommets et arretes).
        pospoints (dict): Un dictionnaire contenant les positions des points.
    
    Returns:
        list : Tableau représentant le graphe
        Retrourne un tableau. Chaque element du tableau est un dictionnaire
        et contient les informations sur un sommet et a ces ces propriétés suivants :
        {
            "id": numéro du sommet (int),
            "nom": nom du sommet (str),
            "num_ligne": numéro de la ligne (str),
            "is_terminus": si le sommet est un terminus (boolean),
            "branchement": branchement du sommet ou station sur sa ligne (str),
                0 stations en commun, 1 pour la direction 1,  2 pour la direction 2
            "voisins": liste les voisins du sommet (dict),
                {num-voisin (str): poids-voisins (int), ...},
            "position": coordonnées du sommet
                [x (int), y (int)]
        }
    """
    
    file_data_graphe = "graphe.json"
    file_data_arretes = "arretes.json"
    # Si le fichier json graphe existe, on lit les données, pas besion de réexéuter l'algo
    if os.path.exists(file_data_graphe):
        # ouverture du json en utf8 pour bien conserer les caracteres spéciaux
        with open(file_data_graphe, 'r', encoding="utf8") as data_sommet_file:
            # on charge les données et les retourne
            return json.load(data_sommet_file)

    # Sinon, crée le graphe à partir des données fichier file_name
    graphe = []
    arretes = []
    # ouverture du json en utf8 pour bien conserer les caracteres spéciaux
    with open(file_name, "r", encoding="utf8") as file:
        # on parcours chaque ligne du fichier
        for ligne in file:
            # si la ligne contient des infos sur un sommet, elle commence par un 'V'
            if ligne.startswith("V"):
                # on sépare les données sur le sommet et les met à leur place
                ligne = ligne[:2] + ";" + ligne[2:6] + ";" + ligne[6:len(ligne) - 2] + ";" + ligne[len(ligne) - 2:]
                V = list(map(str.strip, ligne.split(";")))[1:]
                data_sommet = {
                    "id": int(V[0]), "nom": V[1], "num_ligne": V[2], "is_terminus": V[3], "branchement": V[4],
                    "voisins": {} # list vide pour l'instant, car les arretes sont en bas du fichier
                }
                # ajoute le sommetdans le graphe
                graphe.append(data_sommet)

                # Remarque : le nombre de sommet dans 'pospoints.txt' est supérieur
                # au nombre de sommet dans 'metro.txt'

                # pospoints est un dictionnaire contenante le nom des sommets
                # pour chaque sommet la liste de ses coordonnées

                # On mets en place une structre file d'attente circulaire,
                # le nom du sommet déjà pris (devant teten de file) est mis deriere
                # pop(0) puis append()
                nom = unidecode(V[1]).lower() # nom du sommet
                coordonne_sommet = pospoints[nom].pop(0) # 
                data_sommet["position"] = coordonne_sommet
                # ajoute la position du sommet
                pospoints[nom].append(coordonne_sommet)

            # si la ligne contient des infos sur une arrtet, elle commence par une 'E'
            elif ligne.startswith("E"):
                # sommet1 sommet2 poids
                s1, s2, p = ligne.split()[1:]
                arretes.append([int(s1), int(s2), int(p)])
                # le graphe est non orienté, alors on mets le lien dans les deux sens
                graphe[int(s1)]["voisins"][int(s2)] = int(p)
                graphe[int(s2)]["voisins"][int(s1)] = int(p)

    # Sauvegarde le graphe dans un fichier de graphe.json
    with open(file_data_graphe, 'w', encoding="utf8") as file_save_graphe:
        json.dump(graphe, file_save_graphe)
    # Sauvegarde la liste des arretes dans un fichier de arretes.json
    with open(file_data_arretes, 'w', encoding="utf8") as file_save_arretes:
        json.dump(arretes, file_save_arretes)
    return graphe

def bellmanFord(graphe, s):
    """
    Implémente l'algorithme de Bellman-Ford pour trouver le plus court chemin  à partir d'un sommet source donné dans le graphe.
    
    Complexité O(|V|+|E|)

    Args:
        graphe (list): Le graphe sous forme de liste de sommets avec des voisins pondérés.
        s (int): e sommet source à partir duquel le plus court chemin est recherché.

    Returns: Un tuple contenant deux éléments :
        dict : Un dictionnaire des distances minimales depuis le sommet source à chaque sommet (taille N sommet du graphe)
        list : Une liste de chemins, chaque chemin étant une liste d'indices de sommets formant le plus court chemin (taille N sommet du graphe).

    """
    # Implementation du pseudo-code dans le cours
    # Initialisation des distances minimales,
    d_ = {v: float('inf') for v in range(len(graphe))}
    d_[s] = 0 # infi pour chaque sommet sauf s

    chemins = [[s] for v in graphe] # list de chemin, début avec s pour chaque sommet
    L = [s] # liste des sommets à traiter
    while L: # tant que la liste n'est pas vide
        t = L.pop() # on choisi un sommet et le supprime de la liste
        voisin_t = graphe[t]["voisins"] # les voisins du sommets choisi
        for k in voisin_t: # pour chaque sommet k voisin de t
            k_ = int(k)
            # pour quitter s vers t,
            # si la distance est plus petite passant par ce voisin k
            if d_[k_] > d_[t] + voisin_t[k]:
                d_[k_] = d_[t] + voisin_t[k] # on met à jour la distance 
                L.append(k_) # et ajoute le sommet k dabs la liste à traiter
                chemins[k_] = chemins[t]+[k_] # on met à jour le le chemin aussi
    return d_, chemins

def get_all_ppc(graphe):
    """
    Fait le bellemanFord de tous les sommets vers tous les sommets (many to many).
    Initialise en même temps l'ensemble des lignes de métro.

    Complexité O(|V|²)

    Args:
        graphe (list): données du graphe
    Returns:
        dict_pcc (dict) : bellmanford de tous les sommets
        lignes (dict) : l'ensemble des lignes de métro dans le graphe
    """
    # fichier json de sauvegarde
    fichier_pcc = "ppc_graphe.json"
    if os.path.exists(fichier_pcc):
        with open(fichier_pcc, 'r') as data_json:
            data = json.load(data_json)
            return data["dict_pcc"], data["lignes"]
    liste_lignes_metros = {}

    
    dict_ppc = {str(i): {} for i in range(len(graphe))}
    for i in range(len(graphe)):
        distances, chemins = bellmanFord(graphe, i)
        for j in range(i):
            dict_ppc[str(i)][str(j)] = {"distance":distances[j], "chemin":chemins[j]}
            brchmt_i, brchmt_j = int(graphe[i]['branchement']), int(graphe[j]['branchement'])
            numl_i, numl_j = graphe[i]['num_ligne'], graphe[j]['num_ligne']
            end_i, end_j = graphe[i]['is_terminus'], graphe[j]['is_terminus']
            if end_i == "True" and end_j == "True" and numl_i == numl_j and brchmt_i + brchmt_j != 3:
                if brchmt_i == 2 or brchmt_j == 2:
                    if not numl_i in liste_lignes_metros: liste_lignes_metros[numl_i] = {}
                    if not "2" in liste_lignes_metros[numl_i]:
                        liste_lignes_metros[numl_i]["2"] = chemins[j]
                elif brchmt_i == 1 or brchmt_j == 1:
                    if not numl_i in liste_lignes_metros: liste_lignes_metros[numl_i] = {}
                    if not "1" in liste_lignes_metros[numl_i]:
                        liste_lignes_metros[numl_i]["1"] = chemins[j]
                else: liste_lignes_metros[graphe[i]['num_ligne']] = chemins[j]
    
    data = {"dict_pcc": dict_ppc, "lignes":liste_lignes_metros}
    with open(fichier_pcc, 'w') as data_json:
        json.dump(data, data_json)
    return dict_ppc, liste_lignes_metros


def get_chemin_info(chemin, graphe):
    res = []
    for arret in chemin:
        res.append((arret, graphe[int(arret)]['nom'], graphe[int(arret)]['num_ligne'], graphe[int(arret)]['branchement']))
    return res

def plus_court_chemin(depart, arrive, dict_ppc, graphe):
    res = {}
    if depart > arrive :
        res = dict_ppc[str(depart)][str(arrive)]
    else:
        res = dict_ppc[str(arrive)][str(depart)]
        res["chemin"] = res["chemin"][::-1]
    res['chemin'] = get_chemin_info(res["chemin"], graphe) 
    return res

def get_direction(depart, arrive , liste_lignes_metros, graphe):
    brchmt_d, brchmt_a = int(graphe[depart]['branchement']), int(graphe[arrive]['branchement'])
    if graphe[depart]['num_ligne'] != graphe[arrive]['num_ligne'] or brchmt_d + brchmt_a == 3: return False
    num_ligne = graphe[depart]['num_ligne']
    if brchmt_d == 1 or brchmt_a == 1: chemin = liste_lignes_metros[num_ligne]["1"]
    elif brchmt_d == 2 or brchmt_a == 2: chemin = liste_lignes_metros[num_ligne]["2"]
    elif type(liste_lignes_metros[num_ligne]) is dict and brchmt_d == 0 and brchmt_a == 0:
        chemin = liste_lignes_metros[num_ligne][random.choice(["1", "2"])]
    else: chemin = liste_lignes_metros[num_ligne]
    for s in chemin:
        if s == depart: return graphe[chemin[len(chemin)-1]]["nom"]
        if s == arrive: return graphe[chemin[0]]["nom"]
    return False

temps_debut = time.time()

positions = get_sommet_position("pospoints.txt")
metro_file = "metro.txt"
graphe = get_graphe(metro_file, positions)

# print(graphe)

# acpm, p = prim(graphe, 10)

# print(acpm)
# print(len(acpm))
# print(p)

prim_all_sommet(graphe)


dict_ppc, lignes = get_all_ppc(graphe)

# depart = 363
# arrive = 364
# print(plus_court_chemin(depart,arrive, dict_ppc, graphe))

# print("Direction :",get_direction(depart,arrive, lignes, graphe))

# for l in lignes:
#     print(l,':',lignes[l])
# print(len(lignes))
temps_fin = time.time()
print(f"Temps d'exécution : {temps_fin - temps_debut} secondes")


