filename = "metro.txt"

# Fonctions


def lecture_E(file):
    """Lit les E du fichier avec les stations"""
    liste = []  # Créer une liste vide pour stocker les données des stations
    
    with open(file, "r") as f:
        for ligne in f:
            if ligne.startswith("E"):  # Vérifier si la ligne commence par "E"
                # Diviser la ligne en une liste de stations en supprimant l'espace inutile
                E = ligne.strip()[2:].split()
                liste.append(E)  # Ajouter la liste de stations à la liste principale
    
    return liste

def lecture_V(file):
    """Lit les V du fichier avec les stations"""
    liste = []  # Créer une liste vide pour stocker les données des stations
    
    with open(file, "r") as f:
        for ligne in f:
            if ligne.startswith("V"):  # Vérifier si la ligne commence par "V"
                # Diviser la ligne en une liste de stations en supprimant l'espace inutile
                V = ligne.strip()[2:].split(";")
                liste.append(V)  # Ajouter la liste de stations à la liste principale
    
    return liste


def trouve_arete(i, fichier=filename):
    """
    Trouve les voisins d'un sommet i.
    INPUT :
        - i: un numero de sommet de 4 caractères (str)
        - filename: fichier.txt
    OUTPUT:
        - liste de toutes les arretes de i sous la forme [[i, voisin1, temps], [i, voisin2, temps], [...]]
    """
    liste = lecture_E(fichier)
    res = []
    for sous_liste in liste:
        if str(i) in sous_liste[0: 2]:
            res.append(sous_liste)

    return res


NB_STATIONS = 375





def dfs(s, liste, visited = 0):
    """
    Visite les stations qui sont connexes à la première station de la liste.
    Si une station est bien connexe: alors visited=1
    Sinon visited=0
    """
    # Initialisation de visited à 0
    # 0 signifie non visité
    if visited == 0:
        visited = 1
        for i in range(len(liste)):
            liste[i].append("visited=0")
    
    liste_arete = trouve_arete(s)
    liste[int(s)][3] = "visited=1"
    for sous_liste in liste_arete:
        # Pour chaque sommet voisin de s faire
        if sous_liste[0] != str(s) and liste[int(sous_liste[0])][3] == "visited=0":
            dfs(int(sous_liste[0]), liste, 1)  # recursivité
        elif sous_liste[1] != str(s) and liste[int(sous_liste[1])][3] == "visited=0":
            dfs(int(sous_liste[1]), liste, 1)  # récursivité
    
    
    return liste


def connexe(filename):
    """Vérifie si un graphe filename est connexe"""
    liste = dfs(0, lecture_V(filename))

    for i in range(len(liste)):
        if liste[i][3] == "visited=0":
            return False

    return True


print(connexe(filename))