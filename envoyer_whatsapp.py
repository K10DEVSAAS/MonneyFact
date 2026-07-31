import os
import sys
import time
import urllib.parse
import webbrowser

# Forcer l'encodage UTF-8 pour la console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ==============================================================================
# PROSPECTS CONFIRMÉS ABIDJAN (PÂTISSERIES, STYLISTES, BOUTIQUES MODE, TRAITEUR)
# ==============================================================================

prospects = [
    {
        "nom": "Pâtisserie La Passion",
        "zone": "Riviera Faya, Abidjan",
        "telephone": "2250707592139",
        "activite": "Pâtisserie, Viennoiserie & Formations",
        "probleme": "vos clients et élèves en formation manquent d'un catalogue digital interactif pour réserver vos gâteaux et cours en 1-clic.",
        "solution": "un catalogue web gourmand interactif avec réservation de commandes et paiement d'acomptes en ligne."
    },
    {
        "nom": "Zes't Pâtisserie",
        "zone": "Riviera Palmeraie, Abidjan",
        "telephone": "2250759665959",
        "activite": "Cake Design & Salon de Thé",
        "probleme": "la prise de commande de vos gâteaux personnalisés sur WhatsApp demande beaucoup d'échanges manuels de devis et visuels.",
        "solution": "une page web sur-mesure où vos clients personnalisent leur gâteau (saveurs, taille) et commandent directement."
    },
    {
        "nom": "Pâtisseries Africaine",
        "zone": "Abidjan",
        "telephone": "2250702065086",
        "activite": "Pâtisserie & Desserts",
        "probleme": "vos clients n'ont pas accès à une carte digitale mise à jour en temps réel pour vos livraisons quotidiennes.",
        "solution": "une menu-boutique web ultra-rapide reliée directement à votre WhatsApp pour booster vos livraisons."
    },
    {
        "nom": "Boulangerie-Pâtisserie Abobo",
        "zone": "Abobo Samaké, Abidjan",
        "telephone": "2250709080000",
        "activite": "Boulangerie-Pâtisserie artisanale",
        "probleme": "la prise de commande groupée de pains et viennoiseries manquent d'un outil de réservation express.",
        "solution": "un formulaire web de commande express pour vos clients professionnels et particuliers."
    },
    {
        "nom": "DORA MOTI",
        "zone": "Angré Château, Abidjan",
        "telephone": "2250758840701",
        "activite": "Styliste & Modéliste sur-mesure",
        "probleme": "la présentation de vos collections et la gestion des devis de sur-mesure manquent d'un portfolio haut de gamme.",
        "solution": "un lookbook web élégant où vos clientes sélectionnent leur modèle et réservent leur prise de mesure."
    },
    {
        "nom": "Croqueuse de Merveilles",
        "zone": "Riviera Palmeraie, Abidjan",
        "telephone": "2250768225021",
        "activite": "Prêt-à-porter Femme & Mode",
        "probleme": "vos abonnées TikTok n'ont pas de boutique en ligne où voir l'ensemble des stocks et tailles disponibles en 1 coup d'œil.",
        "solution": "une mini-boutique web e-commerce synchrone avec votre compte WhatsApp pour valider les ventes sans perte de temps."
    },
    {
        "nom": "Boutique mode Angré Chu",
        "zone": "Angré, station Oryx, Abidjan",
        "telephone": "2250150266060",
        "activite": "Mode & Prêt-à-porter",
        "probleme": "les commandes depuis TikTok manquent d'un catalogue produit structuré pour valider rapidement les paniers.",
        "solution": "un catalogue web d'articles avec panier WhatsApp instantané."
    },
    {
        "nom": "Divine Touch' Créations",
        "zone": "Riviera Faya, Abidjan",
        "telephone": "2250779686979",
        "activite": "Couture, Retouches & Création",
        "probleme": "le suivi de la confection des commandes et la délivrance des reçus/factures clients se font encore à la main.",
        "solution": "une plateforme web de suivi de création et d'émission automatique de factures/reçus pros."
    },
    {
        "nom": "Cuisine Maison",
        "zone": "Abidjan / Traiteur",
        "telephone": "33658319155",
        "activite": "Traiteur & Restauration à domicile",
        "probleme": "votre menu traiteur du jour n'a pas de vitrine digitale pour recevoir les précommandes du midi.",
        "solution": "un menu du jour web interactif permettant de réserver son plat en 1 clic."
    }
]

def simuler_touche_entree():
    cmd = 'powershell -c "$wshell = New-Object -ComObject wscript.shell; Start-Sleep -Milliseconds 800; $wshell.SendKeys(\'{ENTER}\')"'
    os.system(cmd)

def envoyer_messages_prospects_abidjan():
    print("=" * 75)
    print("   ENVOI AUX PROSPECTS CONFIRMÉS WHATSAPP - ABIDJAN & SECTEURS CIBLÉS")
    print("=" * 75)
    print(f"\n{len(prospects)} prospects qualifiés avec WhatsApp confirmé prêts.\n")

    for i, prospect in enumerate(prospects, 1):
        nom = prospect["nom"]
        zone = prospect["zone"]
        activite = prospect["activite"]
        phone = prospect["telephone"]
        probleme = prospect["probleme"]
        solution = prospect["solution"]

        message = (
            f"Bonjour à l'équipe de {nom} ({activite}) !\n\n"
            f"J'espère que vous allez bien. En découvrant vos magnifiques créations et services à {zone}, j'ai remarqué que {probleme}\n\n"
            f"En tant que Développeur Web, je peux mettre en place pour vous {solution}\n\n"
            f"Seriez-vous disponible 5 minutes cette semaine pour une courte démonstration ou un échange rapide sans engagement ?\n\n"
            f"Excellente journée,\nVotre Développeur Web"
        )

        encoded_text = urllib.parse.quote(message)
        url_app = f"whatsapp://send?phone={phone}&text={encoded_text}"

        print(f"[{i}/{len(prospects)}] [{nom}] ({zone}) -> +{phone}")
        webbrowser.open(url_app)
        
        # Attendre le chargement dans WhatsApp Desktop
        time.sleep(3)
        
        # Envoi automatique de la touche Entrée
        simuler_touche_entree()
        
        time.sleep(2)

    print("\nTous les messages pour vos 9 prospects d'Abidjan ont été transmis avec succès !")

if __name__ == "__main__":
    envoyer_messages_prospects_abidjan()
