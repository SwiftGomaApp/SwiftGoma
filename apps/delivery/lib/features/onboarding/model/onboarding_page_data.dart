class OnboardingPageData {
  const OnboardingPageData({
    required this.image,
    required this.title,
    required this.description,
  });

  final String image;
  final String title;
  final String description;

  static const List<OnboardingPageData> pages = [
    OnboardingPageData(
      image: 'assets/images/onboarding_1.svg',
      title: 'Get delivery jobs nearby',
      description:
          'Receive new orders as they come in and pick the ones that work for you.',
    ),
    OnboardingPageData(
      image: 'assets/images/onboarding_2.svg',
      title: 'Navigate with live GPS',
      description:
          'Turn-by-turn directions from pickup to drop-off, every trip.',
    ),
    OnboardingPageData(
      image: 'assets/images/onboarding_3.svg',
      title: 'Earn on your schedule',
      description:
          'Get paid for every delivery and track your earnings in real time.',
    ),
  ];
}
