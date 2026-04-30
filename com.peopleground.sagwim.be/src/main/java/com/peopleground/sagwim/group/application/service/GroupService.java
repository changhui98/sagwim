package com.peopleground.sagwim.group.application.service;

import com.peopleground.sagwim.global.configure.CustomUser;
import com.peopleground.sagwim.global.dto.PageResponse;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.group.domain.GroupErrorCode;
import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.entity.GroupMemberRole;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import com.peopleground.sagwim.group.presentation.dto.request.GroupCreateRequest;
import com.peopleground.sagwim.group.presentation.dto.request.GroupUpdateRequest;
import com.peopleground.sagwim.group.presentation.dto.response.GroupDetailResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupMemberResponse;
import com.peopleground.sagwim.group.presentation.dto.response.GroupResponse;
import com.peopleground.sagwim.image.application.service.ImageService;
import com.peopleground.sagwim.image.domain.entity.ImageTargetType;
import com.peopleground.sagwim.image.presentation.dto.response.ImageResponse;
import com.peopleground.sagwim.user.domain.UserErrorCode;
import com.peopleground.sagwim.user.domain.entity.User;
import com.peopleground.sagwim.user.domain.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final ImageService imageService;

    @Transactional
    public GroupResponse createGroup(GroupCreateRequest request, CustomUser customUser) {
        User leader = getUser(customUser.getUsername());

        Group group = Group.of(
            request.name(),
            request.description(),
            request.category(),
            request.meetingType(),
            request.region(),
            request.maxMemberCount(),
            leader
        );

        Group saved = groupRepository.save(group);

        // 생성자를 자동으로 LEADER로 등록
        GroupMember leaderMember = GroupMember.of(saved, leader, GroupMemberRole.LEADER);
        groupMemberRepository.save(leaderMember);
        groupRepository.incrementMemberCount(saved.getId());

        return GroupResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getGroups(int page, int size, String keyword, GroupCategory category) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groups = groupRepository.findAll(pageable, keyword, category);
        return PageResponse.from(groups.map(GroupResponse::from));
    }

    /**
     * 생성된 지 7일 미만인 신규 모임 목록을 조회합니다.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getNewGroups(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groups = groupRepository.findNewGroups(pageable);
        return PageResponse.from(groups.map(GroupResponse::from));
    }

    /**
     * 좋아요 수 내림차순으로 인기 모임 목록을 조회합니다.
     */
    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getPopularGroups(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groups = groupRepository.findPopularGroups(pageable);
        return PageResponse.from(groups.map(GroupResponse::from));
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse getGroup(Long groupId) {
        Group group = findGroup(groupId);
        List<GroupMemberResponse> members = groupMemberRepository.findByGroupId(groupId)
            .stream()
            .map(GroupMemberResponse::from)
            .toList();
        return GroupDetailResponse.of(group, members);
    }

    @Transactional
    public GroupResponse updateGroupImage(Long groupId, MultipartFile file, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        ImageResponse imageResponse = imageService.uploadImage(file, ImageTargetType.GROUP, String.valueOf(groupId));
        group.updateImageUrl(imageResponse.fileUrl());

        return GroupResponse.from(group);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, GroupUpdateRequest request, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        group.update(
            request.name(),
            request.description(),
            request.category(),
            request.meetingType(),
            request.region(),
            request.maxMemberCount()
        );

        return GroupResponse.from(group);
    }

    @Transactional
    public void deleteGroup(Long groupId, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        // 소속 멤버 전체 배치 삭제 (개별 삭제 루프 제거)
        groupMemberRepository.deleteAllByGroupId(groupId);

        User user = getUser(customUser.getUsername());
        group.delete(user);
    }

    @Transactional
    public void joinGroup(Long groupId, CustomUser customUser) {
        Group group = findGroup(groupId);

        if (groupMemberRepository.existsByGroupIdAndUsername(groupId, customUser.getUsername())) {
            throw new AppException(GroupErrorCode.GROUP_ALREADY_JOINED);
        }

        if (group.isFull()) {
            throw new AppException(GroupErrorCode.GROUP_FULL);
        }

        User user = getUser(customUser.getUsername());
        GroupMember member = GroupMember.of(group, user, GroupMemberRole.MEMBER);
        groupMemberRepository.save(member);

        groupRepository.incrementMemberCount(groupId);
    }

    @Transactional
    public void leaveGroup(Long groupId, CustomUser customUser) {
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUsername(groupId, customUser.getUsername())
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_MEMBER));

        if (member.isLeader()) {
            throw new AppException(GroupErrorCode.GROUP_LEADER_CANNOT_LEAVE);
        }

        findGroup(groupId);
        groupMemberRepository.delete(member);
        groupRepository.decrementMemberCount(groupId);
    }

    @Transactional
    public void kickMember(Long groupId, String targetUsername, CustomUser customUser) {
        Group group = findGroup(groupId);
        validateLeader(group, customUser.getUsername());

        GroupMember targetMember = groupMemberRepository
            .findByGroupIdAndUsername(groupId, targetUsername)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_MEMBER_NOT_FOUND));

        groupMemberRepository.delete(targetMember);
        groupRepository.decrementMemberCount(groupId);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getMembers(Long groupId) {
        findGroup(groupId);
        return groupMemberRepository.findByGroupId(groupId)
            .stream()
            .map(GroupMemberResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<GroupResponse> getMyGroups(CustomUser customUser, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groups = groupRepository.findByMemberUsername(customUser.getUsername(), pageable);
        return PageResponse.from(groups.map(GroupResponse::from));
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new AppException(GroupErrorCode.GROUP_NOT_FOUND));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new AppException(UserErrorCode.USER_NOT_FOUND));
    }

    private void validateLeader(Group group, String username) {
        if (!group.getLeader().getUsername().equals(username)) {
            throw new AppException(GroupErrorCode.GROUP_FORBIDDEN);
        }
    }
}
