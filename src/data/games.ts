import { GameMetadata, AICompanion } from '../types/casino';

export const GAME_CATALOG: GameMetadata[] = [
  {
    id: 'made-men',
    title: 'The World Is Yours',
    type: 'slot',
    theme: 'Scarface Mansion & Babylon Free Spins',
    rtp: 96.0,
    rtpVariants: [94.0, 95.5, 96.0],
    houseEdge: 4.0,
    volatility: 'Medium',
    tagline: '5x3 Miami Slot · 20 Lines · Tony Wilds & "Little Friend" Free Spins',
    minBet: 1,
    maxBet: 500,
    maxMultiplier: 1000,
    paylines: 20,
    isPlayable: true
  },
  {
    id: 'back-room-blackjack',
    title: 'Babylon VIP Blackjack',
    type: 'table',
    theme: 'Ocean Drive private salon & high roller felt',
    rtp: 99.5,
    rtpVariants: [99.0, 99.5],
    houseEdge: 0.5,
    volatility: 'Low',
    tagline: '6 Decks · Dealer Stands on Soft 17 · 3:2 Natural Blackjack',
    minBet: 5,
    maxBet: 1000,
    maxMultiplier: 2.5,
    isPlayable: true
  },
  {
    id: 'wheel-of-the-don',
    title: 'Wheel of Miami',
    type: 'table',
    theme: 'Penthouse suite European single-zero roulette',
    rtp: 97.3,
    rtpVariants: [97.3],
    houseEdge: 2.7,
    volatility: 'Medium',
    tagline: 'European Single-Zero Roulette · 37 Numbers · 35:1 Straight-Up',
    minBet: 1,
    maxBet: 500,
    maxMultiplier: 36,
    isPlayable: true
  },
  {
    id: 'bootleg-run',
    title: 'Biscayne Speedboat',
    type: 'slot',
    theme: 'Midnight smuggler run & neon getaway',
    rtp: 95.5,
    rtpVariants: [94.0, 95.5, 96.5],
    houseEdge: 4.5,
    volatility: 'High',
    tagline: '5x4 Ways Slot · 1,024 Ways · Twin-Turbo Multipliers',
    minBet: 1,
    maxBet: 250,
    maxMultiplier: 2500,
    isPlayable: false
  },
  {
    id: 'the-vault',
    title: 'Ocean Drive Vault',
    type: 'slot',
    theme: 'Offshore bank heist & cascading multipliers',
    rtp: 96.2,
    rtpVariants: [94.5, 96.2],
    houseEdge: 3.8,
    volatility: 'Very High',
    tagline: '6x5 Cluster Pays · Tumble Re-Spins · 5,000x Max Cap',
    minBet: 2,
    maxBet: 200,
    maxMultiplier: 5000,
    isPlayable: false
  },
  {
    id: 'numbers-racket',
    title: 'Cocaine Cowboys 1983',
    type: 'slot',
    theme: 'Sunbelt ledger & gold hold-and-win',
    rtp: 95.0,
    rtpVariants: [93.5, 95.0],
    houseEdge: 5.0,
    volatility: 'Low',
    tagline: '3x3 Classic Mechanical · 5 Lines · Rapid Cash Respins',
    minBet: 1,
    maxBet: 100,
    maxMultiplier: 500,
    isPlayable: false
  },
  {
    id: 'neon-nights',
    title: 'Babylon Club Nights',
    type: 'slot',
    theme: 'Disco synth front & champagne bonus',
    rtp: 96.5,
    rtpVariants: [95.0, 96.5],
    houseEdge: 3.5,
    volatility: 'Medium',
    tagline: '5x3 Synth Slot · Retro Vinyl Bonus Round',
    minBet: 1,
    maxBet: 300,
    maxMultiplier: 1200,
    isPlayable: false
  },
  {
    id: 'the-sitdown',
    title: 'Tony Montana Empire',
    type: 'slot',
    theme: 'Five families & progressive cartel jackpot',
    rtp: 95.0,
    rtpVariants: [94.0, 95.0],
    houseEdge: 5.0,
    volatility: 'High',
    tagline: '5x5 Grid · 1% Progressive DCDN Jackpot Contribution',
    minBet: 5,
    maxBet: 500,
    maxMultiplier: 10000,
    isPlayable: false
  },
  {
    id: 'high-roller-baccarat',
    title: 'Key Biscayne Baccarat',
    type: 'table',
    theme: 'Private yacht salon & squeeze card',
    rtp: 98.94,
    rtpVariants: [98.94],
    houseEdge: 1.06,
    volatility: 'Low',
    tagline: 'Punto Banco · Banker 1.06% Edge · 5% Commission',
    minBet: 25,
    maxBet: 2500,
    maxMultiplier: 9,
    isPlayable: false
  }
];

export const AI_CAST: AICompanion[] = [
  {
    id: 'don-sal',
    name: 'Tony Montana',
    title: 'The Ocean Drive Kingpin',
    avatarSeed: 'tony-scarface',
    accentColor: '#F43F5E',
    bio: 'Arrived on the boat from Havana with nothing. Now owns the whole city of Miami. Respects courage, commands the room, and expects winners at his tables.',
    catchphrases: [
      'Who put this thing together? Me, that’s who! Play with guts, chico!',
      'Say hello to my little friend! In my casino, we cash out heavy!',
      'I tell you the truth, even when I lie. Check the seeds—the house odds are clean!'
    ],
    sampleResponses: [
      {
        prompt: 'Tony, how is my luck looking tonight?',
        text: 'Luck is for losers waiting on a bus, chico! In this town, you want something? You reach out and you take it! Bet with steel in your spine and watch the reels spin!'
      },
      {
        prompt: 'Are these odds certified, Tony?',
        text: 'Every single number is certified HMAC-SHA256 down to the last digit! I run a multi-million dollar empire—I don’t need to nickel-and-dime you on rigged reels, okay?!'
      },
      {
        prompt: 'Toast to a big hit, boss!',
        text: 'Tony pours an expensive 1982 vintage into a crystal goblet: "Here’s to the guys who don’t back down! You beat the bank tonight, chico! Don’t let nobody tell you different!"'
      }
    ]
  },
  {
    id: 'carmela',
    name: 'Elvira Hancock',
    title: 'The Queen of Babylon',
    avatarSeed: 'elvira-babylon',
    accentColor: '#06B6D4',
    bio: 'The glamorous queen of the Babylon Club. Platinum blonde, silk slip dresses, and iced champagne. Loves players who know how to play high stakes with effortless cool.',
    catchphrases: [
      'Don’t get greedy, darling. Take your cut and buy me champagne.',
      'Tony thinks he owns all of Miami, but the Babylon moves to my rhythm.',
      'Roll those dice, honey. Tonight Ocean Drive is on fire.'
    ],
    sampleResponses: [
      {
        prompt: 'Elvira, what should I play tonight?',
        text: 'Sit at "The World Is Yours" slot and wait for Tony’s tiger scatters. Or come over to the VIP blackjack table... the cards are hot and the music is loud.'
      },
      {
        prompt: 'Sing a tune for my next spin, Elvira!',
        text: 'Elvira smiles behind dark sunglasses: "Turn up the synthesizer, darling... let the neon lights guide the reels. Let’s make Tony pay up tonight!"'
      },
      {
        prompt: 'Toast to a big hit, darling!',
        text: 'Elvira clinks her crystal champagne flute: "To champagne on the penthouse balcony and never looking back. Now don’t give it back to Tony on the next spin!"'
      }
    ]
  },
  {
    id: 'lefty',
    name: 'Manny Ribera',
    title: 'The Right-Hand Wingman',
    avatarSeed: 'manny-vice',
    accentColor: '#F59E0B',
    bio: 'Tony’s trusted brother-in-arms. Keeps the speedboats fueled, charms the high-rollers in linen suits, and counts the greenbacks before the Miami sunrise.',
    catchphrases: [
      'Hey chico, keep your cool. We got the whole world waiting for us.',
      'Another big score? That’s what I’m talking about, man!',
      'Tony handles the talk, I make sure the cash gets paid on the dot.'
    ],
    sampleResponses: [
      {
        prompt: 'Manny, tell me about the Biscayne speedboat run!',
        text: 'Two in the morning off Key Biscayne. Two 500-horsepower outboards, no lights, dodging the coast guard cutters under the moonlight. We delivered 500 kilos and bought sports cars the next morning!'
      },
      {
        prompt: 'Can anyone rig this casino, Manny?',
        text: 'Nobody touches the code, hermano. Tony would feed them to his tiger! Everything is sealed tighter than Fort Knox with SHA-256 math.'
      },
      {
        prompt: 'Toast to a big hit, Manny!',
        text: 'Manny flashes a million-dollar grin: "Salud, brother! That’s how we do it in 1983 Miami! Put some aside for the Porsche dealer tomorrow!"'
      }
    ]
  }
];
