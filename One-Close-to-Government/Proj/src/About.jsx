function About() {


    return (
        <section
            id="about"
            className="px-6 py-12 max-w-5xl mx-auto text-center"
        >
            <div className="pt-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <h1 className="text-5xl text-black-900 font-bold tracking-tight">About Us</h1>
                </div>
                <div>
                    <p className="pt-6">Our Crowdsourced Civic Issue Reporting and Resolution System is a citizen-first
                        platform designed to make communities cleaner, greener, and more responsive. It empowers
                        residents to easily report local civic issues like potholes, broken streetlights, or
                        overflowing garbage bins through a simple mobile interface. Each report can include photos, l
                        ocation details, and descriptions, ensuring municipal teams receive complete and actionable
                        information. Citizens can also track the progress of their submissions in real time,
                        from acknowledgment to resolution, fostering transparency and trust. On the administrative
                        side, municipal staff gain access to a powerful web dashboard with automated routing,
                        prioritization, and analytics — helping departments respond faster, allocate resources
                        efficiently, and improve service delivery. Together, we’re enabling smarter governance,
                        stronger civic engagement, and a cleaner, greener future for all.</p>
                </div>
            </div>
        </section>
    );
}

export default About;