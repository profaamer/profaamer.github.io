async function getEnrollment(courseKey) {
  const user = await requireAuth();
  if (!user) return null;
  const { data } = await supabaseClient
    .from('course_enrollments')
    .select('id,status,enrolled_at')
    .eq('user_id', user.id)
    .eq('course_key', courseKey)
    .maybeSingle();
  return data || null;
}

async function getCreatorLearningContext(userId, courseKey) {
  const [{ data: creator }, { data: course }] = await Promise.all([
    supabaseClient.from('content_creators').select('user_id,status,full_name').eq('user_id', userId).maybeSingle(),
    supabaseClient.from('courses').select('course_key,creator_user_id').eq('course_key', courseKey).maybeSingle()
  ]);
  const approvedCreator = !!(creator && creator.status === 'approved');
  return {
    isCreator: approvedCreator,
    isOwnCourse: approvedCreator && !!course && course.creator_user_id === userId,
    creator: creator || null,
    course: course || null
  };
}

async function enrollInCourse(courseKey, courseType, buttonId, messageId) {
  const user = await requireAuth();
  if (!user) return;
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);
  if (button) button.disabled = true;
  if (message) message.textContent = 'Enrolling...';

  const context = await getCreatorLearningContext(user.id, courseKey);
  if (context.isOwnCourse) {
    if (message) message.textContent = 'You are the Course Content Creator of this course and cannot enrol in your own course.';
    if (button) { button.textContent = 'YOUR COURSE'; button.disabled = true; }
    return;
  }

  const existing = await getEnrollment(courseKey);
  if (existing && ['active','completed'].includes(existing.status)) {
    if (message) message.textContent = existing.status === 'completed' ? 'You have already completed this course.' : 'You are already enrolled in this course.';
    if (button) { button.textContent = existing.status === 'completed' ? 'COMPLETED' : 'ENROLLED'; button.disabled = true; }
    return;
  }

  let error;
  if (existing) {
    ({ error } = await supabaseClient
      .from('course_enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabaseClient.from('course_enrollments').insert({
      user_id: user.id,
      course_key: courseKey,
      course_type: courseType,
      status: 'active'
    }));
  }

  if (error) {
    if (message) message.textContent = 'Unable to enrol right now. Please try again.';
    if (button) button.disabled = false;
    return;
  }

  if (message) message.textContent = 'Enrolment successful. This course is now available in My Learning Courses.';
  if (button) { button.textContent = 'ENROLLED'; button.disabled = true; }
}

async function syncEnrollmentButton(courseKey, buttonId, messageId) {
  const user = await requireAuth();
  if (!user) return;
  const context = await getCreatorLearningContext(user.id, courseKey);
  const button = document.getElementById(buttonId);
  const message = document.getElementById(messageId);
  if (context.isOwnCourse) {
    if (button) { button.textContent = 'YOUR COURSE'; button.disabled = true; }
    if (message) message.textContent = 'You cannot enrol in a course created by you.';
    return;
  }
  const enrollment = await getEnrollment(courseKey);
  if (enrollment && ['active','completed'].includes(enrollment.status)) {
    if (button) { button.textContent = enrollment.status === 'completed' ? 'COMPLETED' : 'ENROLLED'; button.disabled = true; }
    if (message) message.textContent = enrollment.status === 'completed' ? 'Course completed.' : 'Already in My Learning Courses.';
  }
}
