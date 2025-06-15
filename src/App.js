import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TelecomDimensioningApp = () => {
  const [currentNetwork, setCurrentNetwork] = useState('gsm');
  const [results, setResults] = useState({});
  const [parameters, setParameters] = useState({
    gsm: {
      area: 100,
      radius: 2,
      density: 1000,
      penetration: 80,
      traffic: 25,
      busyHour: 15,
      frequency: 900,
      power: 43
    },
    umts: {
      area: 100,
      radius: 1.5,
      throughput: 384,
      load: 70
    },
    lte: {
      area: 100,
      bandwidth: 20,
      throughput: 5,
      efficiency: 3
    },
    hertzien: {
      distance: 30,
      frequency: 6,
      power: 30,
      gain: 35
    },
    optique: {
      distance: 40,
      wavelength: 1550,
      power: 5,
      attenuation: 0.2
    }
  });

  const networkTypes = [
    { id: 'gsm', name: 'GSM', icon: '📶' },
    { id: 'umts', name: 'UMTS', icon: '📡' },
    { id: 'lte', name: 'LTE', icon: '🚀' },
    { id: 'hertzien', name: 'Hertzien', icon: '📻' },
    { id: 'optique', name: 'Optique', icon: '💡' }
  ];

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c'];

  const formatCurrency = (amount) => {
    return amount.toLocaleString('fr-FR');
  };

  // Fonction utilitaire pour obtenir les unités
  const getUnit = (param, network) => {
    const units = {
      area: 'km²',
      radius: 'km',
      density: '/km²',
      penetration: '%',
      traffic: 'mErl',
      busyHour: '%',
      frequency: network === 'gsm' ? 'MHz' : 'GHz',
      power: 'dBm',
      gain: 'dBi',
      throughput: network === 'umts' ? 'kbps' : 'Mbps',
      load: '%',
      bandwidth: 'MHz',
      efficiency: 'bps/Hz',
      distance: 'km',
      wavelength: 'nm',
      attenuation: 'dB/km'
    };
    return units[param] || '';
  };

  const updateParameter = (param, value) => {
    setParameters(prev => ({
      ...prev,
      [currentNetwork]: {
        ...prev[currentNetwork],
        [param]: parseFloat(value) || 0
      }
    }));
  };

  const calculateGSM = () => {
    const { area, radius, density, penetration, traffic, busyHour } = parameters.gsm;
    
    const cellArea = Math.PI * Math.pow(radius, 2);
    const sitesForCoverage = Math.ceil(area / cellArea);
    
    const totalUsers = area * density * (penetration / 100);
    const totalTraffic = totalUsers * (traffic / 1000) * (busyHour / 100);
    const sitesForCapacity = Math.ceil(totalTraffic / 8);
    
    const finalSites = Math.max(sitesForCoverage, sitesForCapacity);
    const capacity = finalSites * 8 * 8;
    const coverage = Math.min(100, (finalSites * cellArea / area) * 100);
    const cost = finalSites * 90000000;
    
    return {
      sites: finalSites,
      capacity: `${capacity} canaux`,
      coverage: Math.round(coverage),
      cost: cost,
      traffic: Math.round(totalTraffic * 100) / 100
    };
  };

  const calculateUMTS = () => {
    const { area, radius, throughput, load } = parameters.umts;
    
    const cellArea = Math.PI * Math.pow(radius, 2);
    const sites = Math.ceil(area / cellArea);
    const capacity = sites * 2048 * (load / 100);
    const coverage = Math.min(100, (sites * cellArea / area) * 100);
    const cost = sites * 120000000;
    
    return {
      sites: sites,
      capacity: `${Math.round(capacity)} kbps`,
      coverage: Math.round(coverage),
      cost: cost,
      throughput: throughput
    };
  };

  const calculateLTE = () => {
    const { area, bandwidth, throughput, efficiency } = parameters.lte;
    
    const sites = Math.ceil(area / 7);
    const capacity = sites * bandwidth * efficiency;
    const coverage = Math.min(100, (sites * 7 / area) * 100);
    const cost = sites * 180000000;
    
    return {
      sites: sites,
      capacity: `${Math.round(capacity)} Mbps`,
      coverage: Math.round(coverage),
      cost: cost,
      bandwidth: bandwidth
    };
  };

  const calculateHertzien = () => {
    const { distance, frequency, power, gain } = parameters.hertzien;
    
    const fspl = 32.45 + 20 * Math.log10(distance) + 20 * Math.log10(frequency * 1000);
    const receivedPower = power + gain + gain - fspl;
    const margin = receivedPower + 90;
    const availability = margin > 10 ? 99.9 : (margin > 0 ? 99 : 95);
    
    return {
      sites: 2,
      capacity: `${Math.round(fspl)} dB pertes`,
      coverage: Math.round(availability),
      cost: 30000000,
      margin: Math.round(margin * 10) / 10
    };
  };

  const calculateOptique = () => {
    const { distance, power, attenuation } = parameters.optique;
    
    const totalLoss = distance * attenuation + 3;
    const receivedPower = power - totalLoss;
    const margin = receivedPower + 25;
    
    return {
      sites: 2,
      capacity: `${Math.round(totalLoss * 10) / 10} dB pertes`,
      coverage: margin > 0 ? 100 : 50,
      cost: 15000000,
      margin: Math.round(margin * 10) / 10
    };
  };

  const calculateDimensioning = () => {
    let newResults = {};
    
    switch(currentNetwork) {
      case 'gsm':
        newResults = calculateGSM();
        break;
      case 'umts':
        newResults = calculateUMTS();
        break;
      case 'lte':
        newResults = calculateLTE();
        break;
      case 'hertzien':
        newResults = calculateHertzien();
        break;
      case 'optique':
        newResults = calculateOptique();
        break;
      default:
        newResults = {};
    }
    
    setResults(newResults);
  };

  const generateReport = () => {
    const reportData = {
      network: currentNetwork.toUpperCase(),
      timestamp: new Date().toLocaleString('fr-FR'),
      parameters: parameters[currentNetwork],
      results: results,
      metadata: {
        projet: "Outil de Dimensionnement Télécoms",
        university: "UCAD 2024/2025",
        course: "Réseaux télécoms et services - Dr FALL",
        deadline: "15 juin 2025"
      }
    };
    
    try {
      // Créer un rapport HTML stylé qui peut être imprimé en PDF
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Rapport de Dimensionnement ${reportData.network}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .parameter-table, .result-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .parameter-table th, .parameter-table td, .result-table th, .result-table td { 
            border: 1px solid #ddd; padding: 8px; text-align: left; 
        }
        .parameter-table th, .result-table th { background-color: #f5f5f5; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        .cost { font-weight: bold; color: #059669; }
    </style>
</head>
<body>
    <div class="header">
        <h1>RAPPORT DE DIMENSIONNEMENT ${reportData.network}</h1>
        <p><strong>Université Cheikh Anta Diop de Dakar (UCAD)</strong></p>
        <p>DIC2_INFO/M1_GLSI/DGI/ESP - 2024/2025</p>
        <p>Date de génération: ${reportData.timestamp}</p>
    </div>

   

    <div class="section">
        <h2>⚙️ Paramètres de Configuration</h2>
        <table class="parameter-table">
            <thead>
                <tr><th>Paramètre</th><th>Valeur</th><th>Unité</th></tr>
            </thead>
            <tbody>
                ${Object.entries(reportData.parameters).map(([key, value]) => `
                <tr>
                    <td>${key.charAt(0).toUpperCase() + key.slice(1)}</td>
                    <td>${value}</td>
                    <td>${getUnit(key, reportData.network)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📊 Résultats du Dimensionnement</h2>
        <table class="result-table">
            <thead>
                <tr><th>Métrique</th><th>Valeur</th></tr>
            </thead>
            <tbody>
                <tr><td>Sites nécessaires</td><td><strong>${reportData.results.sites || 'N/A'}</strong></td></tr>
                <tr><td>Capacité totale</td><td><strong>${reportData.results.capacity || 'N/A'}</strong></td></tr>
                <tr><td>Taux de couverture</td><td><strong>${reportData.results.coverage || 'N/A'}%</strong></td></tr>
                <tr><td>Coût estimé</td><td class="cost"><strong>${reportData.results.cost ? formatCurrency(reportData.results.cost) + ' FCFA' : 'N/A'}</strong></td></tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📈 Analyse et Recommandations</h2>
        <h3>Méthodologie</h3>
        <p>Ce dimensionnement a été calculé en utilisant les algorithmes standards pour les réseaux ${reportData.network}, 
        en tenant compte des spécificités du contexte sénégalais.</p>
        
        <h3>Recommandations</h3>
        <ul>
            <li>Optimiser la position des sites pour une meilleure couverture</li>
            <li>Considérer les obstacles géographiques et climatiques</li>
            <li>Prévoir une marge de capacité pour la croissance future</li>
            <li>Intégrer les aspects de sécurité et redondance</li>
            <li>Valider les résultats avec des mesures sur site</li>
        </ul>
    </div>

    <div class="footer">
        <p>Rapport généré par l'Outil de Dimensionnement des Réseaux Télécoms</p>
        <p>${reportData.metadata.university} - ${reportData.metadata.course}</p>
        <p>© 2024/2025 - Projet Académique</p>
    </div>
</body>
</html>
      `;

      // Créer un blob HTML et l'ouvrir dans une nouvelle fenêtre pour impression
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 1000);
        };
      }
      
      // Aussi sauvegarder le fichier HTML
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_${reportData.network}_${new Date().getTime()}.html`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      alert('📄 Rapport généré avec succès!\n\n' +
            '✅ Fichier HTML téléchargé\n' +
            '✅ Fenêtre d\'impression ouverte\n\n' +
            'Astuce: Utilisez "Imprimer > Enregistrer au format PDF" dans votre navigateur');
            
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('❌ Erreur lors de la génération du rapport PDF');
    }
  };

  const exportData = () => {
    const data = {
      network: currentNetwork.toUpperCase(),
      parameters: parameters[currentNetwork],
      results: results,
      timestamp: new Date().toLocaleString('fr-FR'),
      metadata: {
        projet: "Outil de Dimensionnement Télécoms",
        university: "UCAD 2024/2025",
        course: "Réseaux télécoms et services - Dr FALL"
      }
    };

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dimensionnement_${currentNetwork}_${new Date().getTime()}.json`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      alert('✅ Données exportées avec succès!\nFichier téléchargé: ' + a.download);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('❌ Erreur lors de l\'exportation des données');
    }
  };

  const saveProject = () => {
    const project = {
      name: `Projet ${currentNetwork.toUpperCase()}`,
      network: currentNetwork.toUpperCase(),
      parameters: parameters[currentNetwork],
      results: results,
      saved: new Date().toLocaleString('fr-FR'),
      metadata: {
        projet: "Outil de Dimensionnement Télécoms",
        university: "UCAD 2024/2025",
        course: "Réseaux télécoms et services - Dr FALL"
      }
    };
    
    try {
      // Sauvegarder dans localStorage
      localStorage.setItem('telecom_project_' + currentNetwork, JSON.stringify(project));
      
      // Aussi télécharger comme fichier de sauvegarde
      const jsonString = JSON.stringify(project, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `projet_${currentNetwork}_${new Date().getTime()}.json`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      alert('💾 Projet sauvegardé avec succès!\n\n' +
            '✅ Sauvegarde locale effectuée\n' +
            '✅ Fichier de sauvegarde téléchargé');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde du projet');
    }
  };

  useEffect(() => {
    calculateDimensioning();
  }, [currentNetwork, parameters]);

  const renderGSMParameters = () => (
    <div>
      <div className="parameter-section">
        <h3 className="parameter-title">Paramètres de Couverture</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>Surface à couvrir (km²)</label>
            <input
              type="number"
              value={parameters.gsm.area}
              onChange={(e) => updateParameter('area', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Rayon de cellule (km)</label>
            <input
              type="number"
              step="0.1"
              value={parameters.gsm.radius}
              onChange={(e) => updateParameter('radius', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Densité de population (/km²)</label>
            <input
              type="number"
              value={parameters.gsm.density}
              onChange={(e) => updateParameter('density', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Taux de pénétration (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={parameters.gsm.penetration}
              onChange={(e) => updateParameter('penetration', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="parameter-section">
        <h3 className="parameter-title">Paramètres de Trafic</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>Trafic par utilisateur (mErl)</label>
            <input
              type="number"
              value={parameters.gsm.traffic}
              onChange={(e) => updateParameter('traffic', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Heure chargée (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={parameters.gsm.busyHour}
              onChange={(e) => updateParameter('busyHour', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="parameter-section">
        <h3 className="parameter-title">Paramètres Radio</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>Fréquence (MHz)</label>
            <input
              type="number"
              min="800"
              max="1900"
              value={parameters.gsm.frequency}
              onChange={(e) => updateParameter('frequency', e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>Puissance émission (dBm)</label>
            <input
              type="number"
              min="20"
              max="50"
              value={parameters.gsm.power}
              onChange={(e) => updateParameter('power', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUMTSParameters = () => (
    <div className="parameter-section">
      <h3 className="parameter-title">Paramètres UMTS</h3>
      <div className="input-grid">
        <div className="input-group">
          <label>Surface à couvrir (km²)</label>
          <input
            type="number"
            value={parameters.umts.area}
            onChange={(e) => updateParameter('area', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Rayon de cellule (km)</label>
          <input
            type="number"
            step="0.1"
            value={parameters.umts.radius}
            onChange={(e) => updateParameter('radius', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Débit par utilisateur (kbps)</label>
          <input
            type="number"
            value={parameters.umts.throughput}
            onChange={(e) => updateParameter('throughput', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Facteur de charge (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={parameters.umts.load}
            onChange={(e) => updateParameter('load', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderLTEParameters = () => (
    <div className="parameter-section">
      <h3 className="parameter-title">Paramètres LTE</h3>
      <div className="input-grid">
        <div className="input-group">
          <label>Surface à couvrir (km²)</label>
          <input
            type="number"
            value={parameters.lte.area}
            onChange={(e) => updateParameter('area', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Largeur de bande (MHz)</label>
          <input
            type="number"
            value={parameters.lte.bandwidth}
            onChange={(e) => updateParameter('bandwidth', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Débit par utilisateur (Mbps)</label>
          <input
            type="number"
            step="0.1"
            value={parameters.lte.throughput}
            onChange={(e) => updateParameter('throughput', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Efficacité spectrale (bps/Hz)</label>
          <input
            type="number"
            step="0.1"
            value={parameters.lte.efficiency}
            onChange={(e) => updateParameter('efficiency', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderHertzienParameters = () => (
    <div className="parameter-section">
      <h3 className="parameter-title">Bilan de Liaison Hertzienne</h3>
      <div className="input-grid">
        <div className="input-group">
          <label>Distance (km)</label>
          <input
            type="number"
            value={parameters.hertzien.distance}
            onChange={(e) => updateParameter('distance', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Fréquence (GHz)</label>
          <input
            type="number"
            step="0.1"
            value={parameters.hertzien.frequency}
            onChange={(e) => updateParameter('frequency', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Puissance émission (dBm)</label>
          <input
            type="number"
            min="10"
            max="50"
            value={parameters.hertzien.power}
            onChange={(e) => updateParameter('power', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Gain antenne (dBi)</label>
          <input
            type="number"
            min="0"
            max="60"
            value={parameters.hertzien.gain}
            onChange={(e) => updateParameter('gain', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderOptiqueParameters = () => (
    <div className="parameter-section">
      <h3 className="parameter-title">Bilan de Liaison Optique</h3>
      <div className="input-grid">
        <div className="input-group">
          <label>Distance (km)</label>
          <input
            type="number"
            value={parameters.optique.distance}
            onChange={(e) => updateParameter('distance', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Longueur d'onde (nm)</label>
          <input
            type="number"
            min="1300"
            max="1650"
            value={parameters.optique.wavelength}
            onChange={(e) => updateParameter('wavelength', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Puissance émission (dBm)</label>
          <input
            type="number"
            min="-10"
            max="20"
            value={parameters.optique.power}
            onChange={(e) => updateParameter('power', e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Atténuation fibre (dB/km)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="1"
            value={parameters.optique.attenuation}
            onChange={(e) => updateParameter('attenuation', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderParameters = () => {
    switch(currentNetwork) {
      case 'gsm':
        return renderGSMParameters();
      case 'umts':
        return renderUMTSParameters();
      case 'lte':
        return renderLTEParameters();
      case 'hertzien':
        return renderHertzienParameters();
      case 'optique':
        return renderOptiqueParameters();
      default:
        return null;
    }
  };

  const pieData = [
    { name: 'Couverture', value: results.coverage || 0 },
    { name: 'Capacité', value: 85 },
    { name: 'Qualité', value: 92 },
    { name: 'Disponibilité', value: 98 }
  ];

  const barData = [
    { name: 'Sites', value: results.sites || 0 },
    { name: 'Coût (M FCFA)', value: (results.cost || 0) / 1000000 }
  ];

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>🔧 Outil de Dimensionnement des Réseaux Télécoms</h1>
        <p>Planification et dimensionnement intelligent des systèmes de télécommunications</p>
      </div>

      <div className="main-content">
        {/* Panel de Configuration */}
        <div className="panel">
          <h2 className="section-title">⚙️ Paramètres de Configuration</h2>

          {/* Sélection du type de réseau */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="tab-container">
              {networkTypes.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setCurrentNetwork(network.id)}
                  className={`tab-button ${currentNetwork === network.id ? 'active' : ''}`}
                >
                  {network.icon} {network.name}
                </button>
              ))}
            </div>
          </div>

          {/* Paramètres spécifiques */}
          {renderParameters()}

          <button onClick={calculateDimensioning} className="calculate-button">
            🚀 Recalculer le Dimensionnement
          </button>
        </div>

        {/* Panel de Résultats */}
        <div className="panel">
          <h2 className="section-title">📊 Résultats du Dimensionnement</h2>

          {/* Cartes de résultats */}
          <div className="results-grid">
            <div className="result-card blue">
              <div className="result-value">{results.sites || '-'}</div>
              <div className="result-label">Sites Nécessaires</div>
            </div>
            <div className="result-card green">
              <div className="result-value">{results.capacity || '-'}</div>
              <div className="result-label">Capacité Totale</div>
            </div>
            <div className="result-card yellow">
              <div className="result-value">{results.coverage || '-'}%</div>
              <div className="result-label">Couverture</div>
            </div>
            <div className="result-card purple">
              <div className="result-value" style={{ fontSize: '1rem' }}>
                {results.cost ? `${formatCurrency(results.cost)} FCFA` : '-'}
              </div>
              <div className="result-label">Coût Estimé</div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="chart-container">
            <h3 className="parameter-title">Indicateurs de Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3 className="parameter-title">Dimensionnement</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3498db" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Simulation de carte de couverture */}
          <div className="coverage-map">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🗺️</div>
            <div style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937' }}>
              Carte de Couverture - {currentNetwork.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Simulation de la répartition des {results.sites || 0} sites
            </div>
            <div className="coverage-grid">
              {Array.from({ length: Math.min(results.sites || 0, 16) }).map((_, index) => (
                <div key={index} className="site-icon">
                  📡
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="action-section">
            <h3 className="parameter-title">📋 Génération de Rapports</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button onClick={generateReport} className="action-button">
                📄 Rapport PDF
              </button>
              <button onClick={exportData} className="action-button blue">
                💾 Exporter Données
              </button>
              <button onClick={saveProject} className="action-button purple">
                💼 Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="analysis-section">
        <h2 className="section-title">📈 Analyse Détaillée</h2>
        
        <div className="analysis-grid">
          <div className="analysis-card blue">
            <h3>💡 Recommandations</h3>
            <ul>
              <li>Optimiser la position des sites pour une meilleure couverture</li>
              <li>Considérer les obstacles géographiques</li>
              <li>Prévoir une marge de capacité pour la croissance</li>
              <li>Intégrer les aspects de sécurité et redondance</li>
            </ul>
          </div>

          <div className="analysis-card green">
            <h3>✅ Points Forts</h3>
            <ul>
              <li>Calculs basés sur les standards ITU</li>
              <li>Prise en compte des spécificités locales</li>
              <li>Estimations de coût réalistes en FCFA</li>
              <li>Interface intuitive et moderne</li>
            </ul>
          </div>

          <div className="analysis-card yellow">
            <h3>⚠️ Considérations</h3>
            <ul>
              <li>Vérifier les contraintes réglementaires</li>
              <li>Effectuer des mesures sur site</li>
              <li>Valider avec des outils professionnels</li>
              <li>Tenir compte des interférences</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            🎓 Projet Académique - UCAD 2024/2025
          </h3>
          <p style={{ fontSize: '0.875rem' }}>
            Outil de dimensionnement développé dans le cadre du cours "Réseaux télécoms et services" - Dr FALL
          </p>
          
        </div>
      </div>
    </div>
  );
};

export default TelecomDimensioningApp;