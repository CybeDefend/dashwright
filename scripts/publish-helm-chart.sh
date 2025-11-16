#!/bin/bash

# Script pour publier le Helm Chart sur GitHub Pages
# Usage: ./scripts/publish-helm-chart.sh

set -e

CHART_DIR="helm-chart"
OWNER="CybeDefend"
REPO="dashwright"
BRANCH="gh-pages"

echo "🚀 Publication du Helm Chart Dashwright"
echo "========================================"

# Vérifier que Helm est installé
if ! command -v helm &> /dev/null; then
    echo "❌ Erreur: Helm n'est pas installé"
    echo "   Installez Helm: https://helm.sh/docs/intro/install/"
    exit 1
fi

# Vérifier qu'on est sur la branche main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Attention: Vous n'êtes pas sur la branche main (branche actuelle: $CURRENT_BRANCH)"
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Vérifier qu'il n'y a pas de modifications non commitées
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Attention: Vous avez des modifications non commitées"
    git status -s
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Lire la version du chart
CHART_VERSION=$(grep '^version:' $CHART_DIR/Chart.yaml | awk '{print $2}')
echo "📦 Version du chart: $CHART_VERSION"

# Créer le répertoire de release
RELEASE_DIR=".cr-release-packages"
mkdir -p $RELEASE_DIR

# Packager le chart
echo "📦 Packaging du chart..."
helm package $CHART_DIR -d $RELEASE_DIR/

PACKAGE_FILE="$RELEASE_DIR/dashwright-$CHART_VERSION.tgz"

if [ ! -f "$PACKAGE_FILE" ]; then
    echo "❌ Erreur: Le package n'a pas été créé: $PACKAGE_FILE"
    exit 1
fi

echo "✅ Package créé: $PACKAGE_FILE"

# Créer un tag git si il n'existe pas
TAG="helm-chart-$CHART_VERSION"
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Le tag $TAG existe déjà"
else
    echo "🏷️  Création du tag $TAG..."
    git tag -a "$TAG" -m "Release Helm Chart version $CHART_VERSION"
    echo "✅ Tag créé: $TAG"
    
    read -p "Voulez-vous pousser le tag sur GitHub ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin "$TAG"
        echo "✅ Tag poussé sur GitHub"
    fi
fi

# Sauvegarder la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)

# Checkout sur gh-pages
echo "🔀 Switch vers la branche $BRANCH..."
git fetch origin
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git checkout --orphan $BRANCH
    git rm -rf .
    echo "# Dashwright Helm Charts" > README.md
    echo "" >> README.md
    echo "This repository hosts Helm charts for Dashwright." >> README.md
    echo "" >> README.md
    echo "## Usage" >> README.md
    echo "" >> README.md
    echo '```bash' >> README.md
    echo "helm repo add dashwright https://$OWNER.github.io/$REPO" >> README.md
    echo "helm repo update" >> README.md
    echo "helm install dashwright dashwright/dashwright" >> README.md
    echo '```' >> README.md
    git add README.md
    git commit -m "Initial commit"
fi

# Copier le package
echo "📋 Copie du package..."
cp $PACKAGE_FILE .

# Générer ou mettre à jour l'index
echo "📝 Génération de l'index Helm..."
if [ -f "index.yaml" ]; then
    helm repo index . --url "https://$OWNER.github.io/$REPO" --merge index.yaml
else
    helm repo index . --url "https://$OWNER.github.io/$REPO"
fi

# Commit et push
echo "💾 Commit des changements..."
git add "dashwright-$CHART_VERSION.tgz" index.yaml
git commit -m "Release Helm chart version $CHART_VERSION" || echo "Aucun changement à commiter"

read -p "Voulez-vous pousser vers GitHub Pages ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin $BRANCH
    echo "✅ Chart publié sur GitHub Pages!"
    echo ""
    echo "🎉 Le chart sera disponible dans quelques minutes à:"
    echo "   https://$OWNER.github.io/$REPO"
    echo ""
    echo "Pour l'utiliser:"
    echo "   helm repo add dashwright https://$OWNER.github.io/$REPO"
    echo "   helm repo update"
    echo "   helm install dashwright dashwright/dashwright"
else
    echo "⚠️  Changements non poussés. Pour pousser plus tard:"
    echo "   git push origin $BRANCH"
fi

# Retour à la branche d'origine
echo "🔙 Retour à la branche $CURRENT_BRANCH..."
git checkout $CURRENT_BRANCH

# Nettoyer
echo "🧹 Nettoyage..."
rm -rf $RELEASE_DIR

echo ""
echo "✅ Publication terminée!"
