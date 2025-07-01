import { BookOpen, Users, Target, ExternalLink } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About This Project
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive collection of study notes from the Ethereum Protocol Studies program, 
            designed to help anyone understand how Ethereum really works.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-12">
          {/* About EPS */}
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <BookOpen className="h-8 w-8 text-ethereum-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">What is Ethereum Protocol Studies?</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p>
                Ethereum Protocol Studies (EPS) is a study group designed to prepare and onboard 
                fellows for the Ethereum Protocol Fellowship. The program covers all aspects of 
                the Ethereum protocol, from execution and consensus layers to testing, security, 
                and future roadmap.
              </p>
              <p>
                EPS features lectures from Ethereum core developers, researchers, and industry 
                experts who share their deep knowledge of how Ethereum works under the hood.
              </p>
            </div>
          </section>

          {/* About These Notes */}
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-ethereum-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">About These Notes</h2>
            </div>
            <div className="prose prose-lg max-w-none">
              <p>
                These notes represent a personal journey through the Ethereum Protocol Studies 
                program. They are compiled from lecture content, speaker slides, Ethereum 
                specifications, articles, and additional research.
              </p>
              <p>
                The goal is to make Ethereum protocol knowledge more accessible and provide 
                a comprehensive resource for anyone looking to understand the technical details 
                of how Ethereum works.
              </p>
              <blockquote className="border-l-4 border-ethereum-500 pl-4 italic text-gray-700">
                "One aim: to understand how Ethereum really works"
              </blockquote>
            </div>
          </section>

          {/* Program Structure */}
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-ethereum-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Program Structure</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Core Topics Covered</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Execution Layer Architecture</li>
                  <li>• Consensus Layer & Gasper</li>
                  <li>• Ethereum Virtual Machine (EVM)</li>
                  <li>• State Management & Data Structures</li>
                  <li>• Networking (devp2p & libp2p)</li>
                  <li>• Testing & Security</li>
                  <li>• Sharding & Data Availability</li>
                  <li>• Protocol Upgrades & Roadmap</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Learning Outcomes</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Deep understanding of Ethereum architecture</li>
                  <li>• Knowledge of protocol development</li>
                  <li>• Insight into future roadmap</li>
                  <li>• Technical foundation for contributing</li>
                  <li>• Connection with the Ethereum community</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acknowledgments */}
          <section className="bg-ethereum-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Acknowledgments</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Huge respect and utmost gratitude to the EPS mentors Mario Havel and Josh Davis, 
                and all the speakers who shared their expertise. This learning journey wouldn't 
                have been possible without their dedication to education and community building.
              </p>
              <p>
                Special thanks to all the Ethereum core developers and researchers who continue 
                to push the boundaries of what's possible in decentralized systems.
              </p>
            </div>
          </section>

          {/* Resources */}
          <section className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Official Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="https://epf.wiki" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      EPF Wiki <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ethereum.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      Ethereum.org <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://eips.ethereum.org" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      Ethereum Improvement Proposals <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Technical Specs</h3>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="https://github.com/ethereum/consensus-specs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      Consensus Specs <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://github.com/ethereum/execution-specs" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      Execution Specs <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://ethereum.github.io/yellowpaper/paper.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-ethereum-600 hover:text-ethereum-700 inline-flex items-center"
                    >
                      Ethereum Yellow Paper <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
} 