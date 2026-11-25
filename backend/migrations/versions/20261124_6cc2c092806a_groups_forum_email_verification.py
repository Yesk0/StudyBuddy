"""groups forum email verification

Revision ID: 6cc2c092806a
Revises: b2ea9392f051
Create Date: 2026-11-24 22:14:18.301537

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = '6cc2c092806a'
down_revision: str | None = 'b2ea9392f051'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('email_verifications',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('code_hash', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('sent_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_email_verifications_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id', name=op.f('pk_email_verifications'))
    )
    op.create_table('forum_posts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('course_id', sa.Integer(), nullable=True),
    sa.Column('title', sa.String(length=120), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_forum_posts_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['course_id'], ['courses.id'], name=op.f('fk_forum_posts_course_id_courses'), ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_forum_posts'))
    )
    op.create_index(op.f('ix_forum_posts_author_id'), 'forum_posts', ['author_id'], unique=False)
    op.create_index(op.f('ix_forum_posts_course_id'), 'forum_posts', ['course_id'], unique=False)
    op.create_table('study_groups',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=False),
    sa.Column('course_id', sa.Integer(), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=False),
    sa.Column('max_members', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['course_id'], ['courses.id'], name=op.f('fk_study_groups_course_id_courses'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name=op.f('fk_study_groups_owner_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_study_groups'))
    )
    op.create_index(op.f('ix_study_groups_course_id'), 'study_groups', ['course_id'], unique=False)
    op.create_table('forum_comments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('author_id', sa.Integer(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], name=op.f('fk_forum_comments_author_id_users'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], name=op.f('fk_forum_comments_post_id_forum_posts'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_forum_comments'))
    )
    op.create_index(op.f('ix_forum_comments_post_id'), 'forum_comments', ['post_id'], unique=False)
    op.create_table('group_join_requests',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('message', sa.String(length=300), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], name=op.f('fk_group_join_requests_group_id_study_groups'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_group_join_requests_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_group_join_requests'))
    )
    op.create_index(op.f('ix_group_join_requests_group_id'), 'group_join_requests', ['group_id'], unique=False)
    op.create_index(op.f('ix_group_join_requests_user_id'), 'group_join_requests', ['user_id'], unique=False)
    op.create_table('group_members',
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['study_groups.id'], name=op.f('fk_group_members_group_id_study_groups'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_group_members_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('group_id', 'user_id', name=op.f('pk_group_members'))
    )
    op.create_index(op.f('ix_group_members_user_id'), 'group_members', ['user_id'], unique=False)
    op.add_column('messages', sa.Column('group_id', sa.Integer(), nullable=True))
    op.alter_column('messages', 'connection_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.create_index('ix_messages_group_id_id', 'messages', ['group_id', 'id'], unique=False)
    op.create_foreign_key(op.f('fk_messages_group_id_study_groups'), 'messages', 'study_groups', ['group_id'], ['id'], ondelete='CASCADE')
    op.add_column('study_sessions', sa.Column('group_id', sa.Integer(), nullable=True))
    op.add_column('study_sessions', sa.Column('reminder_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('study_sessions', 'connection_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.create_index(op.f('ix_study_sessions_group_id'), 'study_sessions', ['group_id'], unique=False)
    op.create_foreign_key(op.f('fk_study_sessions_group_id_study_groups'), 'study_sessions', 'study_groups', ['group_id'], ['id'], ondelete='CASCADE')
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))

    # A message or session belongs either to a connection or to a group, never both.
    op.create_check_constraint(
        op.f('ck_messages_one_thread'), 'messages', '(connection_id IS NULL) <> (group_id IS NULL)'
    )
    op.create_check_constraint(
        op.f('ck_study_sessions_one_owner'),
        'study_sessions',
        '(connection_id IS NULL) <> (group_id IS NULL)',
    )
    # Accounts created before email verification existed keep working.
    op.execute('UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL')


def downgrade() -> None:
    op.drop_constraint(op.f('ck_study_sessions_one_owner'), 'study_sessions', type_='check')
    op.drop_constraint(op.f('ck_messages_one_thread'), 'messages', type_='check')
    # Group data cannot exist without groups; remove it before restoring NOT NULL columns.
    op.execute('DELETE FROM messages WHERE group_id IS NOT NULL')
    op.execute('DELETE FROM study_sessions WHERE group_id IS NOT NULL')
    op.drop_column('users', 'email_verified_at')
    op.drop_constraint(op.f('fk_study_sessions_group_id_study_groups'), 'study_sessions', type_='foreignkey')
    op.drop_index(op.f('ix_study_sessions_group_id'), table_name='study_sessions')
    op.alter_column('study_sessions', 'connection_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('study_sessions', 'reminder_sent_at')
    op.drop_column('study_sessions', 'group_id')
    op.drop_constraint(op.f('fk_messages_group_id_study_groups'), 'messages', type_='foreignkey')
    op.drop_index('ix_messages_group_id_id', table_name='messages')
    op.alter_column('messages', 'connection_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.drop_column('messages', 'group_id')
    op.drop_index(op.f('ix_group_members_user_id'), table_name='group_members')
    op.drop_table('group_members')
    op.drop_index(op.f('ix_group_join_requests_user_id'), table_name='group_join_requests')
    op.drop_index(op.f('ix_group_join_requests_group_id'), table_name='group_join_requests')
    op.drop_table('group_join_requests')
    op.drop_index(op.f('ix_forum_comments_post_id'), table_name='forum_comments')
    op.drop_table('forum_comments')
    op.drop_index(op.f('ix_study_groups_course_id'), table_name='study_groups')
    op.drop_table('study_groups')
    op.drop_index(op.f('ix_forum_posts_course_id'), table_name='forum_posts')
    op.drop_index(op.f('ix_forum_posts_author_id'), table_name='forum_posts')
    op.drop_table('forum_posts')
    op.drop_table('email_verifications')
